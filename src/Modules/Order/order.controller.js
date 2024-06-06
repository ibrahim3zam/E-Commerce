import { cartModel } from '../../../DB/Models/cart.model.js'
import { couponModel } from '../../../DB/Models/coupon.model.js'
import { orderModel } from '../../../DB/Models/order.model.js'
import { productModel } from '../../../DB/Models/product.model.js'
import { isCouponValid } from '../../Utils/couponValidation.js'
import { customAlphabet } from 'nanoid'
import createInvoice from '../../Utils/pdfkit.js'
import { sendEmailService } from '../../Services/sendEmailService.js'
import { qrCodeFunction } from '../../Utils/qrCodeFunction.js'
import { paymentFunction } from '../../Utils/payment.js'
import { generateToken, verifyToken } from '../../Utils/tokenFunctions.js'
import Stripe from 'stripe'
const nanoid = customAlphabet('123456_=!ascbhdtel', 5)
import { encryptionFun, decryptionFun } from '../../Utils/encryptionFunction.js'

// ========================== create order =================
export const createOrder = async (req, res, next) => {
    const userId = req.authUser._id
    const {
        productId,
        quantity,
        address,
        phoneNumbers,
        paymentMethod,
        couponCode,
    } = req.body

    // ======================== coupon check ================
    if (couponCode) {
        const coupon = await couponModel
            .findOne({ couponCode })
            .select('isPercentage isFixedAmount couponAmount couponAssginedToUsers')

        const isCouponValidResult = await isCouponValid({
            couponCode,
            userId,
            next,
        })
        if (isCouponValidResult !== true) {
            return isCouponValidResult
        }
        req.coupon = coupon
    }

    // ====================== products check ================
    const products = []
    const isProductValid = await productModel.findOne({
        _id: productId,
        stock: { $gte: quantity },
    })
    if (!isProductValid) {
        return next(
            new Error('invalid product please check your quantity or Id', { cause: 400 }),
        )
    }
    const productObject = {
        productId,
        quantity,
        title: isProductValid.title,
        price: isProductValid.priceAfterDiscount,
        finalPrice: isProductValid.priceAfterDiscount * quantity,
    }
    products.push(productObject)

    //===================== subTotal ======================
    const subTotal = productObject.finalPrice
    //====================== paid Amount =================
    let paidAmount = 0

    if (req.coupon?.isFixedAmount &&
        req.coupon?.couponAmount > subTotal) {
        return next(
            new Error('please add an addtional item to use this coupon', { cause: 400 }),
        )
    }
    if (req.coupon?.isPercentage) {
        paidAmount = subTotal * (1 - (req.coupon.couponAmount || 0) / 100)
    } else if (req.coupon?.isFixedAmount) {
        paidAmount = subTotal - req.coupon.couponAmount
    } else {
        paidAmount = subTotal
    }

    //======================= paymentMethod  + orderStatus ==================
    let orderStatus
    paymentMethod == 'cash' ? (orderStatus = 'placed') : (orderStatus = 'pending')

    const encryptedPhoneNumbers = encryptionFun({ phoneNumber: phoneNumbers })
    // console.log(encryptedPhoneNumbers)
    // console.log(decryptionFun({ encryptedPhoneNumber: encryptedPhoneNumbers }));

    const customId = nanoid()
    const orderObject = {
        userId,
        products,
        address,
        phoneNumbers: encryptedPhoneNumbers,
        orderStatus,
        paymentMethod,
        subTotal,
        paidAmount,
        couponId: req.coupon?._id,
        customId
    }
    req.failedDocument = {
        model: orderModel,
        id: `${customId}, ${userId}`
    }

    const orderDB = await orderModel.create(orderObject)

    if (!orderDB) {
        return next(new Error('fail to create your order', { cause: 400 }))
    }
    // ======================= payment ================================
    let orderSession
    if (orderDB.paymentMethod == 'card') {
        if (req.coupon) {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
            let coupon
            if (req.coupon.isPercentage) {
                coupon = await stripe.coupons.create({
                    percent_off: req.coupon.couponAmount,
                })
            }
            if (req.coupon.isFixedAmount) {
                coupon = await stripe.coupons.create({
                    amount_off: req.coupon.couponAmount * 100,
                    currency: 'EGP',
                })
            }
            req.couponId = coupon.id
        }
        const tokenOrder = generateToken({
            payload: { orderId: orderDB._id },
            signature: process.env.ORDER_TOKEN,
            expiresIn: '1h',
        })
        orderSession = await paymentFunction({
            payment_method_types: [orderDB.paymentMethod],
            mode: 'payment',
            customer_email: req.authUser.email,
            metadata: { orderId: orderDB._id.toString() },
            success_url: `${req.protocol}://${req.headers.host}/order/successOrder?token=${tokenOrder}`,
            cancel_url: `${req.protocol}://${req.headers.host}/order/cancelOrder?token=${tokenOrder}`,
            line_items: orderDB.products.map((ele) => {
                return {
                    price_data: {
                        currency: 'EGP',
                        product_data: {
                            name: ele.title,
                        },
                        unit_amount: ele.price * 100,
                    },
                    quantity: ele.quantity,
                }
            }),
            discounts: req.couponId ? [{ coupon: req.couponId }] : [],
        })
    }
    // increase usageCount for coupon usage
    if (req.coupon) {
        for (const user of req.coupon.couponAssginedToUsers) {
            if (user.userId.toString() == userId.toString()) {
                user.usageCount += 1
            }
        }
        await req.coupon.save()
    }

    // decrease product's stock by order's product quantity
    await productModel.findOneAndUpdate(
        { _id: productId },
        {
            $inc: { stock: -parseInt(quantity) },
        },
    )

    //  remove product from userCart if exist
    const checkUserCart = await cartModel.findOne({
        userId,
        'products.productId': productId
    })
    if (checkUserCart) {

        checkUserCart.products.forEach(({ productId }) => {

            if (productId == req.body.productId) {

                checkUserCart.products.splice(checkUserCart.products.indexOf(productId), 1)
            }
        })

        const updateUserCart = await cartModel.findByIdAndUpdate(checkUserCart._id, { products: checkUserCart.products })
        if (!updateUserCart) { return next(new Error('fail to update User cart', { cause: 400 })) }
    }

    const orderQr = await qrCodeFunction({
        data: { orderId: orderDB._id, products: orderDB.products },
    })
    //============================== invoice =============================
    const orderCode = `${req.authUser.userName}_${nanoid(3)}`
    // generat invoice object
    const orderinvoice = {
        shipping: {
            name: req.authUser.userName,
            address: orderDB.address,
            city: 'Tanta',
            // state: '',
            country: 'Egypt',
        },
        orderCode,
        date: orderDB.createdAt,
        items: orderDB.products,
        subTotal: orderDB.subTotal,
        paidAmount: orderDB.paidAmount,
    }
    // fs.unlink()
    await createInvoice(orderinvoice, `${orderCode}.pdf`)
    await sendEmailService({
        to: req.authUser.email,
        subject: 'Order Confirmation',
        message: '<h1> please find your invoice pdf below</h1>',
        attachments: [
            {
                path: `./Files/${orderCode}.pdf`,
            },
        ],
    })
    return res.status(201).json({ message: 'Order is created Done', orderDB, CheckOutUrl: orderSession.url })

}

// =========================== create order from cart products ====================
export const fromCartoOrder = async (req, res, next) => {
    const userId = req.authUser._id
    const { cartId } = req.query
    const { address, phoneNumbers, paymentMethod, couponCode } = req.body

    const cart = await cartModel.findById(cartId)
    if (!cart || !cart.products.length) {
        return next(new Error('please fill your cart first', { cause: 400 }))
    }

    // ======================== coupon check ================
    if (couponCode) {
        const coupon = await couponModel
            .findOne({ couponCode })
            .select('isPercentage isFixedAmount couponAmount couponAssginedToUsers')
        const isCouponValidResult = await isCouponValid({
            couponCode,
            userId,
            next,
        })
        if (isCouponValidResult !== true) {
            return isCouponValidResult
        }
        req.coupon = coupon
    }

    let subTotal = cart.subTotal
    //====================== paid Amount =================
    let paidAmount = 0
    if (req.coupon?.isFixedAmount &&
        req.coupon?.couponAmount > subTotal) {
        return next(
            new Error('please add an addtional item to use this coupon', { cause: 400 }),
        )
    }
    if (req.coupon?.isPercentage) {
        paidAmount = subTotal * (1 - (req.coupon.couponAmount || 0) / 100)
    } else if (req.coupon?.isFixedAmount) {
        paidAmount = subTotal - req.coupon.couponAmount
    } else {
        paidAmount = subTotal
    }

    //======================= paymentMethod  + orderStatus ==================
    let orderStatus
    paymentMethod == 'cash' ? (orderStatus = 'placed') : (orderStatus = 'pending')
    let orderProduct = []
    for (const product of cart.products) {
        const productExist = await productModel.findById(product.productId)
        orderProduct.push({
            productId: product.productId,
            quantity: product.quantity,
            title: productExist.title,
            price: productExist.priceAfterDiscount,
            finalPrice: productExist.priceAfterDiscount * product.quantity,
        })
    }
    const encryptedPhoneNumbers = encryptionFun({ phoneNumber: phoneNumbers })
    console.log(encryptedPhoneNumbers)

    const customId = nanoid()
    const orderObject = {
        userId,
        products: orderProduct,
        address,
        phoneNumbers: encryptedPhoneNumbers,
        orderStatus,
        paymentMethod,
        subTotal,
        paidAmount,
        couponId: req.coupon?._id,
        customId
    }



    const orderDB = await orderModel.create(orderObject)
    req.failedDocument = {
        model: orderModel,
        _id: orderDB._id
    }
    if (!orderDB) {
        return next(new Error('fail to create your order', { cause: 400 }))
    }
    // ======================= payment ================================
    let orderSession
    if (orderDB.paymentMethod == 'card') {
        if (req.coupon) {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
            let coupon
            if (req.coupon.isPercentage) {
                coupon = await stripe.coupons.create({
                    percent_off: req.coupon.couponAmount,
                })
            }
            if (req.coupon.isFixedAmount) {
                coupon = await stripe.coupons.create({
                    amount_off: req.coupon.couponAmount * 100,
                    currency: 'EGP',
                })
            }
            req.couponId = coupon.id
        }
        const tokenOrder = generateToken({
            payload: { orderId: orderDB._id },
            signature: process.env.ORDER_TOKEN,
            expiresIn: '1h',
        })
        orderSession = await paymentFunction({
            payment_method_types: [orderDB.paymentMethod],
            mode: 'payment',
            customer_email: req.authUser.email,
            metadata: { orderId: orderDB._id.toString() },
            success_url: `${req.protocol}://${req.headers.host}/order/successOrder?token=${tokenOrder}`,
            cancel_url: `${req.protocol}://${req.headers.host}/order/cancelOrder?token=${tokenOrder}`,
            line_items: orderDB.products.map((ele) => {
                return {
                    price_data: {
                        currency: 'EGP',
                        product_data: {
                            name: ele.title,
                        },
                        unit_amount: ele.price * 100,
                    },
                    quantity: ele.quantity,
                }
            }),
            discounts: req.couponId ? [{ coupon: req.couponId }] : [],
        })
    }

    // increase usageCount for coupon usage
    if (req.coupon) {
        for (const user of req.coupon.couponAssginedToUsers) {
            if (user.userId.toString() == userId.toString()) {
                user.usageCount += 1
            }
        }
        await req.coupon.save()
    }

    // decrease product's stock by order's product quantity
    for (const product of cart.products) {
        await productModel.findOneAndUpdate(
            { _id: product.productId },
            {
                $inc: { stock: -parseInt(product.quantity) },
            },
        )
    }

    cart.products = []
    await cart.save()

    const orderQr = await qrCodeFunction({
        data: { orderId: orderDB._id, products: orderDB.products },
    })
    //============================== invoice =============================
    const orderCode = `${req.authUser.userName}_${nanoid(3)}`
    // generat invoice object
    const orderinvoice = {
        shipping: {
            name: req.authUser.userName,
            address: orderDB.address,
            city: 'Tanta',
            // state: '',
            country: 'Egypt',
        },
        orderCode,
        date: orderDB.createdAt,
        items: orderDB.products,
        subTotal: orderDB.subTotal,
        paidAmount: orderDB.paidAmount,
    }
    // fs.unlink()
    await createInvoice(orderinvoice, `${orderCode}.pdf`)
    await sendEmailService({
        to: req.authUser.email,
        subject: 'Order Confirmation',
        message: '<h1> please find your invoice pdf below</h1>',
        attachments: [
            {
                path: `./Files/${orderCode}.pdf`,
            },
        ],
    })

    return res.status(201).json({ message: 'Done', orderDB, orderQr, cart })
}

// ============================= success payment  ===================
export const successPayment = async (req, res, next) => {
    const { token } = req.query
    const decodeData = verifyToken({ token, signature: process.env.ORDER_TOKEN })
    const order = await orderModel.findOne({
        _id: decodeData.orderId,
        orderStatus: 'pending',
    })
    if (!order) {
        return next(new Error('invalid order id', { cause: 400 }))
    }
    order.orderStatus = 'confirmed'
    await order.save()
    res.status(200).json({ message: 'done', order })
}

//================================ cancel payment =====================
export const cancelPayment = async (req, res, next) => {
    const { token } = req.query
    const decodeData = verifyToken({ token, signature: process.env.ORDER_TOKEN })
    const order = await orderModel.findOne({ _id: decodeData.orderId })
    if (!order) {
        return next(new Error('invalid order id', { cause: 400 }))
    }

    //=============== approch one orderSattus:'canceled' =============
    order.orderStatus = 'canceled'
    await order.save()
    //================ delete from db ================
    // await orderModel.findOneAndDelete({ _id: decodeData.orderId })

    //=================== undo prouducts  and coupon  ====================
    for (const product of order.products) {
        await productModel.findByIdAndUpdate(product.productId, {
            $inc: { stock: parseInt(product.quantity) },
        })
    }

    if (order.couponId) {
        const coupon = await couponModel.findById(order.couponId)
        if (!coupon) {
            return next(new Error('invalid coupon id'))
        }
        coupon.couponAssginedToUsers.map((ele) => {
            if (order.userId.toString() == ele.userId.toString()) {
                ele.usageCount -= 1
            }
        })

        await coupon.save()
    }
    res.status(200).json({ message: 'done', order })
}

export const deliverOrder = async (req, res, next) => {
    const { orderId } = req.query

    const order = await orderModel.findOneAndUpdate(
        {
            _id: orderId,
            orderStatus: { $nin: ['delivered', 'pending', 'canceled', 'rejected'] },
        },
        {
            orderStatus: 'delivered',
        },
        {
            new: true,
        },
    )

    if (!order) {
        return next(new Error('invalid order', { cause: 400 }))
    }

    return res.status(200).json({ message: 'Done', order })
}