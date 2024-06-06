import joi from 'joi'
import { generalFields } from '../../Middlewares/validation.js'

export const addCouponSchema = {
    body: joi.object({
        couponCode: joi.string().min(3).max(55).required(),
        couponAmount: joi.number().positive().min(1).max(100).when('isFixedAmount', {
            is: true,
            then: joi.number().min(1)
        }).required(),
        fromDate: joi.date().greater(Date.now() - (24 * 60 * 60 * 1000)).required(),
        toDate: joi.date().greater(joi.ref('fromDate')).required(),
        isPercentage: joi.boolean().optional(),
        isFixedAmount: joi.boolean().optional(),
        couponAssginedToUsers: joi.array().items().min(1).unique().required()
    }).required()
}


export const updateCouponSchema = {
    body: joi.object({
        couponCode: joi.string().min(3).max(55).optional(),
        couponAmount: joi.number().positive().min(1).max(100).when('isFixedAmount', {
            is: true,
            then: joi.number().min(1)
        }).optional(),

        fromDate: joi.date().greater(Date.now() - (24 * 60 * 60 * 1000)).optional(),

        toDate: joi.date().greater(joi.ref('fromDate')).when('fromDate', {
            is: joi.exist(),
            then: joi.required(),
            otherwise: joi.optional()
        }),

        isPercentage: joi.boolean().optional(),
        isFixedAmount: joi.boolean().optional(),
        couponStatus: joi.string().valid('Expired', 'Valid').optional(),
        userId: generalFields.userid.optional(),
        maxUsage: joi.number().positive().min(1).integer()
    }).required(),

    query: joi.object({
        couponId: generalFields.userid.required()
    })

}
export const deleteCouponSchem = {
    query: joi.object({ couponId: generalFields.userid.required() }).required(),
}