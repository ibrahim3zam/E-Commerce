import joi from 'joi'
import { Types } from 'mongoose'
const reqMethods = ['body', 'query', 'params', 'headers', 'file', 'files']

// ======= custome validation for object-Id ========
const validationObjectId = (value, helper) => {
    return Types.ObjectId.isValid(value) ? true : helper.message('invalid id')
}

// ======= fields are used more than once ========
export const generalFields = {
    userid: joi.string().custom(validationObjectId),
    userName: joi
        .string()
        .min(3)
        .max(15)
        .regex(/^[a-zA-Z_-\s]*$/)
        .trim()
        .messages({
            'any.required': 'userName is required',
        }),
    firstName: joi.
        string()
        .min(3)
        .max(8)
        .regex(/^[a-zA-Z\s]*$/)
        .trim(),
    lastName: joi.
        string()
        .min(3)
        .max(8)
        .regex(/^[a-zA-Z\s]*$/)
        .trim(),
    email: joi
        .string()
        .email({ tlds: { allow: ['com', 'net', 'org'] } })
        .regex(/^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+(com|org|net)$/)
        .trim(),
    password: joi
        .string()
        .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{5,}$/)
        .messages({
            'string.pattern.base': 'Password regex fail',
        }),
    cpassword: joi.valid(joi.ref('password')),
    phone: joi.string().trim().pattern(/^[0-9]{11}/),
    title: joi.string().min(3).max(20).trim(),
    description: joi.string().min(5).max(255).trim().optional(),
    file: joi.object({
        size: joi.number().positive().required(),
        path: joi.string().required(),
        filename: joi.string().required(),
        destination: joi.string().required(),
        mimetype: joi.string().required(),
        encoding: joi.string().required(),
        originalname: joi.string().required(),
        fieldname: joi.string().required()
    }).messages({ "any.required": "file is required" }),
    files: joi.array().items(joi.object({
        size: joi.number().positive().required(),
        path: joi.string().required(),
        filename: joi.string().required(),
        destination: joi.string().required(),
        mimetype: joi.string().required(),
        encoding: joi.string().required(),
        originalname: joi.string().required(),
        fieldname: joi.string().required()
    })).messages({ "any.required": "file is required" })
}

// ======== validation for REST =========
export const validationCoreFunction = (schema) => {
    return (req, res, next) => {

        const validationErrorArr = []

        for (const key of reqMethods) {

            if (schema[key]) {

                const validationResult = schema[key].validate(req[key], {
                    abortEarly: false,
                })

                if (validationResult.error) {
                    validationErrorArr.push(validationResult.error.details)
                }
            }
        }

        if (validationErrorArr.length) {
            req.validationErrorArr = validationErrorArr
            return next(new Error('', { cause: 400 }))
        }

        next()
    }
}

// ======== validation for graphQL =========
export const graphQlValidation = async (schema, args) => {
    const { error } = schema.validate(args, { abortEarly: false })
    if (error) {
        return new Error(error)
    }
    return true
}