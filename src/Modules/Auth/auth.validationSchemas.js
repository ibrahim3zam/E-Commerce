import joi from 'joi'
import { generalFields } from '../../Middlewares/validation.js'


export const signUpSchema = {
    body: joi
        .object({
            userName: generalFields.userName.required(),
            email: generalFields.email.required(),
            password: generalFields.password.required(),
            age: joi.number().integer().positive().min(5).max(150).optional(),
            gender: joi.string().valid('male', 'female', 'Not specified').optional(),
            phoneNumber: generalFields.phone.required(),
            address: joi.array().items(joi.string()).unique().required(),
        })
        .required()
}
export const logInSchema = {
    body: joi
        .object({
            email: generalFields.email.required(),
            password: generalFields.password.required(),
        })
        .required()
}

export const forgetPasswordSchema = {
    body: joi
        .object({

            email: generalFields.email.required(),

        })
        .required()
}
export const resetPasswordSchema = {
    body: joi
        .object({

            newPassword: generalFields.password.required(),

        })
        .required()
}