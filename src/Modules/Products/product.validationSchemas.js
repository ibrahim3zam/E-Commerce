import joi from 'joi'
import { generalFields } from '../../Middlewares/validation.js'

export const AddProductSchema = {
    body: joi
        .object({
            title: joi.string().min(5).max(55).lowercase().required(),
            desc: generalFields.description,
            price: joi.number().positive().min(1).required(),
            appliedDiscount: joi.number().min(1).positive().optional(),
            colors: joi.array().items(joi.string()).min(1).unique().optional(),
            sizes: joi.array().items(joi.string()).min(1).unique().optional(),
            stock: joi.number().positive().integer().min(1).required()
        })
        .required()
        .options({ presence: 'required' }),
    files: generalFields.files.required(),
    query: joi.object({
        categoryId: generalFields.userid,
        subCategoryId: generalFields.userid,
        brandId: generalFields.userid
    }).required()
        .options({ presence: 'required' })
}

export const updateProductSchema = {
    body: joi.object({
        title: joi.string().min(5).max(55).optional(),
        desc: joi.string().min(5).max(255).optional(),
        price: joi.number().positive().min(1).optional(),
        appliedDiscount: joi.number().positive().min(1).max(100).optional(),
        colors: joi.array().items(joi.string().required()).unique().optional(),
        sizes: joi.array().items(joi.string().required()).unique().optional(),
        stock: joi.number().integer().positive().min(1).optional(),
    }),
    query: joi.object({
        productId: generalFields.userid.required(),
        categoryId: generalFields.userid,
        subCategoryId: generalFields.userid,
        brandId: generalFields.userid,
    }),
}

export const DeleteProductSchema = {

    query: joi.object({
        productId: generalFields.userid.required(),
    })
}

export const GetSpecificProductSchema = {

    query: joi.object({
        searchKey: joi.string().min(5).max(255).trim().required(),
        page: joi.number().integer().positive().min(1).max(10).optional(),
        size: joi.number().integer().positive().min(2).max(10).optional()
    })
}

export const GetAllProductSchema = {

    query: joi.object({
        page: joi.number().integer().positive().min(1).max(10).optional(),
        size: joi.number().integer().positive().min(2).max(10).optional()
    })
}