import joi from 'joi'
import { generalFields } from '../../Middlewares/validation.js'

export const createCategorySchema = {
    body: joi
        .object({
            name: joi.string().min(4).max(25).lowercase(),
        })
        .required()
        .options({ presence: 'required' }),
    file: generalFields.file.required()
}

export const updateCategorySchema = {
    body: joi
        .object({
            name: joi.string().min(4).max(25).optional(),
        })
        .required(),
    file: joi.object({
        size: joi.number().positive().required(),
        path: joi.string().required(),
        filename: joi.string().required(),
        destination: joi.string().required(),
        mimetype: joi.string().required(),
        encoding: joi.string().required(),
        originalname: joi.string().required(),
        fieldname: joi.string().required()
    }).messages({ "any.required": "file is required" }).optional(),
    query: joi.object({
        categoryId: generalFields.userid
    }).required().options({ presence: 'required' })

}
export const getAllCategories = {
    query: joi
        .object({
            page: joi.number().integer().positive().min(1).max(10).optional(),
            size: joi.number().integer().positive().min(2).max(10).optional()
        }).required()
}

export const deleteCategorySchema = {
    query: joi
        .object({
            categoryId: generalFields.userid,
        })
        .required()
        .options({ presence: 'required' }),
}

// =======================================graphQl Valid Schemas=====================
export const getCategorySchemaQL = joi.object({
    token: joi.string().required(),
    page: joi.number().integer().positive().min(1).max(10).optional(),
    size: joi.number().integer().positive().min(2).max(10).optional()
}).required()

export const deleteCategorySchemaQL = joi.object({
    categoryId: generalFields.userid,
    token: joi.string().required()
}).required()