import slugify from 'slugify'
import { brandModel } from '../../../DB/Models/brand.model.js'
import { categoryModel } from '../../../DB/Models/category.model.js'
import { subCategoryModel } from '../../../DB/Models/subCategory.model.js'
import cloudinary from '../../Utils/cloudinaryConfig.js'
import { paginationFunction } from '../../Utils/pagination.js'
import { customAlphabet } from 'nanoid'
import { productModel } from '../../../DB/Models/product.model.js'
import { ApiFeatures } from '../../Utils/apiFeatures.js'
const nanoid = customAlphabet('123456_=!ascbhdtel', 5)


//=============================Add a product===================
export const addProduct = async (req, res, next) => {
    const { _id } = req.authUser

    const { title, desc, price, appliedDiscount, colors, sizes, stock } = req.body

    const { categoryId, subCategoryId, brandId } = req.query
    // check Ids
    const subCategoryExists = await subCategoryModel.findById(subCategoryId)
    if (!subCategoryExists) {
        return next(new Error('invalid subCategory', { cause: 400 }))
    }

    const categoryExists = await categoryModel.findById(categoryId)
    if (!categoryExists) {
        return next(new Error('invalid category', { cause: 400 }))
    }

    const brandExists = await brandModel.findById(brandId)

    if (!brandExists) {
        return next(new Error('invalid brand', { cause: 400 }))
    }

    if (brandExists.categoryId.toString() !== categoryId.toString() ||
        brandExists.subCategoryId.toString() !== subCategoryId.toString()) {
        return next(new Error('category or subcategory does not related to This brand', { cause: 400 }))
    }

    const slug = slugify(title, {
        replacement: '_',
    })

    const priceAfterDiscount = price * (1 - (appliedDiscount || 0) / 100)


    if (!req.files.length) {
        return next(new Error('please upload pictures', { cause: 400 }))
    }
    const customId = nanoid()
    const Images = []
    const publicIds = []
    for (const file of req.files) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(
            file.path,
            {
                folder: `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}/Brands/${brandExists.customId}/Products/${customId}`,
            },
        )
        Images.push({ secure_url, public_id })
        publicIds.push(public_id)
    }
    req.imagePath = `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}/Brands/${brandExists.customId}/Products/${customId}`

    const productObject = {
        title,
        slug,
        desc,
        price,
        appliedDiscount,
        priceAfterDiscount,
        colors,
        sizes,
        stock,
        categoryId,
        subCategoryId,
        brandId,
        Images,
        customId,
        createdBy: _id
    }


    const product = await productModel.create(productObject)
    req.failedDocument = {
        model: productModel,
        _id: product._id
    }

    if (!product) {
        await cloudinary.api.delete_resources(publicIds)
        await cloudinary.api.delete_folder(req.imagePath)
        return next(new Error('trye again later', { cause: 400 }))
    }
    res.status(200).json({ message: 'Done', product })
}

//=================================update a product===========================
export const updateProduct = async (req, res, next) => {
    const { _id } = req.authUser

    const { title, desc, price, appliedDiscount, colors, sizes, stock } = req.body

    const { productId, categoryId, subCategoryId, brandId } = req.query

    // check productId
    const product = await productModel.findOne({
        _id: productId,
        createdBy: _id
    })
    if (!product) {
        return next(new Error('invalid product id Or userId', { cause: 400 }))
    }

    // ====================================Check Category Id=============================================
    let categoryExists
    if (categoryId) {

        categoryExists = await categoryModel.findById(categoryId)

        if (product.categoryId.toString() !== categoryExists._id.toString()) {

            return next(new Error('invalid Category id', { cause: 400 }))
        }

    }
    else {
        categoryExists = await categoryModel.findById(product.categoryId)
    }


    // ================================Check subCategory Id=================================================

    let subCategoryExists

    if (subCategoryExists) {

        subCategoryExists = await subCategoryModel.findById(subCategoryId)

        if (product.subCategoryId.toString() !== subCategoryExists._id.toString()) {
            return next(new Error('invalid subCategory id', { cause: 400 }))
        }

    }
    else {
        subCategoryExists = await subCategoryModel.findById(product.subCategoryId)
    }

    // ===================================Check Brand Id (OR) Change Path Of Brand==============================================

    let brandExists
    if (brandExists) {

        brandExists = await brandModel.findById(brandId)

        if (product.brandId.toString() !== brandExists._id.toString()) {

            return next(new Error('invalid Brand Id', { cause: 400 }))
        }
    } else {
        brandExists = await brandModel.findById(product.brandId)
    }

    // ============In case getting Price and Discount amount==============
    if (appliedDiscount && price) {
        const priceAfterDiscount = price * (1 - (appliedDiscount) / 100)
        product.priceAfterDiscount = priceAfterDiscount
        product.price = price
        product.appliedDiscount = appliedDiscount
    }
    // ============In case getting Price amount==============
    else if (price) {
        const priceAfterDiscount =
            price * (1 - (product.appliedDiscount || 0) / 100)
        product.priceAfterDiscount = priceAfterDiscount
        product.price = price
    }
    // ============In case getting Discount amount==============
    else if (appliedDiscount) {
        const priceAfterDiscount =
            product.price * (1 - (appliedDiscount) / 100)
        product.priceAfterDiscount = priceAfterDiscount
        product.appliedDiscount = appliedDiscount
    }


    // =================Handle Media of product in the DB and the cloudinary==========
    if (req.files.length) {
        let ImageArr = []
        for (const file of req.files) {
            const { secure_url, public_id } = await cloudinary.uploader.upload(
                file.path,
                {
                    folder: `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}/Brands/${brandExists.customId}/Products/${product.customId}`,
                },
            )
            ImageArr.push({ secure_url, public_id })
        }
        let public_ids = []
        for (const image of product.Images) {
            public_ids.push(image.public_id)
        }
        await cloudinary.api.delete_resources(public_ids)
        product.Images = ImageArr
        // }

    }

    if (title) {
        product.title = title
        product.slug = slugify(title, '_')
    }
    if (desc) product.desc = desc
    if (colors) product.colors = colors
    if (sizes) product.sizes = sizes
    if (stock) product.stock = stock

    product.updatedBy = _id
    await product.save()
    res.status(200).json({ message: 'product has been Updated successfully', product })
}

//=================================delete a product===========================
export const deleteProduct = async (req, res, next) => {
    const { _id } = req.authUser
    const { productId } = req.query
    // check productId =========Delete DB=============
    const product = await productModel.findOneAndDelete({
        _id: productId
        ,
        createdBy: _id
    })
    if (!product) {
        return next(new Error('invalid product id', { cause: 400 }))
    }

    // =================Delete Cloudinary==============
    const category = await categoryModel.findById(product.categoryId)
    if (!category) {
        return next(new Error('invalid category ID', { cause: 400 }))
    }

    const subCateg = await subCategoryModel.findById(product.subCategoryId)
    if (!subCateg) {
        return next(new Error('invalid subCategory ID', { cause: 400 }))
    }

    const brand = await brandModel.findById(product.brandId)
    if (!brand) {
        return next(new Error('invalid brand ID', { cause: 400 }))
    }

    await cloudinary.api.delete_resources_by_prefix(`${process.env.PROJECT_FOLDER}/Categories/${category.customId}/subCategories/${subCateg.customId}/Brands/${brand.customId}/Products/${product.customId}`)

    await cloudinary.api.delete_folder(`${process.env.PROJECT_FOLDER}/Categories/${category.customId}/subCategories/${subCateg.customId}/Brands/${brand.customId}/Products/${product.customId}`)


    res.status(200).json({ message: 'Deleted Done', product })
}

//=================================get all products paginated===========================
export const getAllProd = async (req, res, next) => {
    const { page, size } = req.query
    const { limit, skip } = paginationFunction({ page, size })
    const products = await productModel.find().limit(limit).skip(skip).populate([
        {
            path: 'Reviews',
            select: 'reviewRate reviewComment -productId'
        }
    ])
    res.status(200).json({ message: 'Done', products })
}

//=================================get specific products paginated===========================
export const getProductsByTitle = async (req, res, next) => {
    const { searchKey, page, size } = req.query

    const { limit, skip } = paginationFunction({ page, size })

    const productsc = await productModel
        .find({
            $or: [
                { title: { $regex: searchKey, $options: 'i' } },
                { desc: { $regex: searchKey, $options: 'i' } },
            ],
        })
        .limit(limit)
        .skip(skip)
        .populate([
            {
                path: 'Reviews',
                select: 'reviewRate reviewComment -productId'
            }
        ])
    res.status(200).json({ message: 'Done', productsc })
}

// ========================== apply some features in api =====================
export const listProducts = async (req, res, next) => {

    const ApiFeaturesInstance = new ApiFeatures(productModel.find({}), req.query)
        .pagination()
        .filters()
        .sort()
        .select()
    const products = await ApiFeaturesInstance.mongooseQuery
    res.status(200).json({ message: 'Done', products })
}

