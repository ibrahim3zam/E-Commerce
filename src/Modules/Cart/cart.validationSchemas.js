import joi from 'joi'
import { generalFields } from '../../Middlewares/validation.js'



export const AddToCartSchema = {
    body: joi
        .object({
            productId: generalFields.userid,
            quantity: joi.number().positive().min(1)
        })
        .required()
        .options({ presence: 'required' }),
}

export const DeleteFromCartSchema = {
    query: joi
        .object({
            productId: generalFields.userid,
        })
        .required()
        .options({ presence: 'required' }),
}