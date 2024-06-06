import joi from 'joi'
import { generalFields } from '../../Middlewares/validation.js'



export const CreateOrderSchema = {
    body: joi
        .object({
            productId: generalFields.userid.required(),
            quantity: joi.number().positive().min(1).required(),
            address: joi.string().min(3).max(50).required(),
            phoneNumbers: joi.array().items(joi.string().regex(/^[0-9]{11}$/)).min(1).unique().required(),
            paymentMethod: joi.string().valid('cash', 'card').required(),
            couponCode: joi.string().min(3).max(55)
        })
        .required()
}

export const FromCartToOrderSchema = {
    body: joi
        .object({
            address: joi.string().min(3).max(50).required(),
            phoneNumbers: joi.array().items(joi.string().regex(/^[0-9]{11}$/)).min(1).unique().required(),
            paymentMethod: joi.string().valid('cash', 'card').required(),
            couponCode: joi.string().min(3).max(55)
        })
        .required(),
    query: joi.object({
        cartId: generalFields.userid.required()
    })
}

export const DeliveredSchema = {
    query: joi.object({
        orderId: generalFields.userid.required()
    }).required()
}