import joi from 'joi'
import { generalFields } from '../../Middlewares/validation.js'



export const addReviewSchema = {
    body: joi.object({
        reviewRate: joi.number().min(1).max(5).required(),
        reviewComment: joi.string().min(5).max(255).optional(),
    }),
    query: joi.object({
        productId: generalFields.userid.required()
    })
}

export const GetAllReviewsSchema = {

    query: joi.object({
        page: joi.number().integer().positive().min(1).max(10).optional(),
        size: joi.number().integer().positive().min(2).max(10).optional()
    })
}