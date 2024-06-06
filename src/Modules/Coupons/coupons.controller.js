import { couponModel } from '../../../DB/Models/coupon.model.js'
import { userModel } from '../../../DB/Models/user.model.js'
import moment from 'moment'

// ===========================Add Coupon ========================
export const addCoupon = async (req, res, next) => {
    const { _id } = req.authUser
    const {
        couponCode,
        couponAmount,
        fromDate,
        toDate,
        isPercentage,
        isFixedAmount,
        couponAssginedToUsers
    } = req.body

    // check coupon code if it's duplicate
    const isCouponCodeDuplicate = await couponModel.findOne({ couponCode })
    if (isCouponCodeDuplicate) {
        return next(new Error('duplicate couponCode', { cause: 400 }))
    }

    // check the choice between fixed or percentage amount 
    if ((isFixedAmount === isPercentage)) {
        return next(
            new Error('select if the coupon is percentage or fixedAmount', {
                cause: 400,
            }),
        )
    }

    //======================== assgin to users ==================
    let usersIds = []
    for (const user of couponAssginedToUsers) {
        usersIds.push(user.userId)
    }

    const usersCheck = await userModel.find({
        _id: {
            $in: usersIds,
        },
    })

    if (usersIds.length !== usersCheck.length) {
        return next(new Error('invalid userIds', { cause: 400 }))
    }

    const couponObject = {
        couponCode,
        couponAmount,
        fromDate,
        toDate,
        isPercentage,
        isFixedAmount,
        couponAssginedToUsers,
        // couponAssginedToProduct,
        createdBy: _id,
    }


    const couponDb = await couponModel.create(couponObject)
    req.failedDocument = {
        model: couponModel,
        _id: couponDb._id
    }
    if (!couponDb) {
        return next(new Error('fail to add coupon', { cause: 400 }))
    }
    res.status(201).json({ message: 'Done', couponDb })
}

// ===========================Update Coupon ========================
export const UpdateCoupon = async (req, res, next) => {
    const { _id } = req.authUser
    const { couponId } = req.query
    const {
        couponCode,
        couponAmount,
        fromDate,
        toDate,
        isFixedAmount,
        userId,
        maxUsage
    } = req.body

    // check existing of coupon
    const isCouponExist = await couponModel.findOne({
        _id: couponId,
        createdBy: _id
    }).lean()
    const updatedDocument = await couponModel.hydrate(isCouponExist)

    if (!isCouponExist) {
        return next(new Error('Invalid Coupon Id', { cause: 400 }))
    }

    if (couponCode) {

        if (updatedDocument.couponCode == couponCode.toLowerCase()) {
            return next(new Error('please enter different name from the old coupon name', { cause: 400 }))
        }
        // check coupon code if it's duplicate
        if (await couponModel.findOne({ couponCode })) {
            return next(new Error('duplicate couponCode', { cause: 400 }))
        }

        updatedDocument.couponCode = couponCode
    }

    if (couponAmount) updatedDocument.couponAmount = couponAmount


    if (fromDate && toDate) {

        if (moment(new Date(fromDate)).isBefore(moment(new Date(updatedDocument.fromDate)))) {
            return next(new Error('can not update (from date) before the day of (from date) has already exsit', { cause: 400 }))
        }
        if (moment(new Date(fromDate)).isAfter(moment(new Date()))) {
            updatedDocument.couponStatus = 'Expired'
        } else { updatedDocument.couponStatus = 'Valid' }
    }

    if (isFixedAmount === true) {
        updatedDocument.isFixedAmount = true
        updatedDocument.isPercentage = false
    } else {
        updatedDocument.isFixedAmount = false
        updatedDocument.isPercentage = true
    }

    //======================== assgin to users ==================
    if (userId) {
        let usersIds = []
        let userExists = false

        for (const user of updatedDocument.couponAssginedToUsers) {
            if (userId == user.userId) {
                userExists = true
                user.maxUsage = maxUsage   //===> USE lean() to convert BSON to object to allow editing
            }
        }

        // push new product
        if (!userExists) {
            // =========== Check Id have been entered ================
            const usersCheck = await userModel.findById(userId)

            if (!usersCheck) {
                return next(new Error('invalid user Id', { cause: 400 }))
            }

            updatedDocument.couponAssginedToUsers.push({ userId, maxUsage })
        }
    }



    updatedDocument.updatedBy = _id



    await updatedDocument.save()
    res.status(200).json({ message: 'Updated Done', updatedDocument })

}

// ================================== delete coupon ==========================
export const deleteCoupon = async (req, res, next) => {
    const { couponId } = req.query
    const { _id } = req.authUser

    const isCouponCodeDuplicated = await couponModel.findOneAndDelete({
        _id: couponId,
        createdBy: _id,
    })
    if (!isCouponCodeDuplicated) {
        return next(new Error('invalid couponId', { cause: 400 }))
    }
    res.status(201).json({ message: 'Deleted done' })
}