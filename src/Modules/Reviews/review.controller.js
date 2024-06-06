import { orderModel } from '../../../DB/Models/order.model.js'
import { productModel } from '../../../DB/Models/product.model.js'
import { reviewModel } from '../../../DB/Models/review.model.js'
import { paginationFunction } from '../../Utils/pagination.js'
import { ApiFeatures } from '../../Utils/apiFeatures.js'
//============================ add review ================
export const addReview = async (req, res, next) => {
    const userId = req.authUser._id
    const { productId } = req.query

    // ================================= check  procduct ===================
    const isProductValidToBeReviewd = await orderModel.findOne({
        userId,
        'products.productId': productId,
        orderStatus: 'delivered',
    })
    if (!isProductValidToBeReviewd) {
        return next(new Error('you should buy the product first', { cause: 400 }))
    }

    const { reviewRate, reviewComment } = req.body
    const reviewObject = {
        userId,
        productId,
        reviewComment,
        reviewRate,
    }
    const reviewDB = await reviewModel.create(reviewObject)
    req.failedDocument = {
        model: reviewModel,
        _id: reviewDB._id
    }
    if (!reviewDB) {
        return next(new Error('fail to add review', { cause: 500 }))
    }

    const product = await productModel.findById(productId)
    const reviews = await reviewModel.find({ productId })
    let sumOfRates = 0
    for (const review of reviews) {
        sumOfRates += review.reviewRate
    }
    product.rate = Number(sumOfRates / reviews.length).toFixed(2)
    await product.save()

    res.status(201).json({ message: 'Done', reviewDB, product })
}

//============================   ================== 
export const getAllReviews = async (req, res, next) => {
    const { page, size } = req.query
    const { limit, skip } = paginationFunction({ page, size })

    const reviews = await reviewModel.find().limit(limit).skip(skip)
    if (!reviews.length) {
        return next(new Error('there are no longer reviews', { cause: 400 }))
    }

    res.status(200).json({ message: 'Done', reviews })
}

// ===================== apply some features in api ==============
export const listReviews = async (req, res, next) => {

    const ApiFeaturesInstance = new ApiFeatures(reviewModel.find({}), req.query)
        .pagination()
        .filters()
        .sort()
        .select()
    const reviews = await ApiFeaturesInstance.mongooseQuery
    res.status(200).json({ message: 'Done', reviews })
}
