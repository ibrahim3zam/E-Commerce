import slugify from 'slugify'
import { categoryModel } from '../../../DB/Models/category.model.js'
import { subCategoryModel } from '../../../DB/Models/subCategory.model.js'
import { productModel } from '../../../DB/Models/product.model.js'
import cloudinary from '../../Utils/cloudinaryConfig.js'
import { customAlphabet } from 'nanoid'
import { brandModel } from '../../../DB/Models/brand.model.js'
import { paginationFunction } from '../../Utils/pagination.js'
const nanoid = customAlphabet('123456_=!ascbhdtel', 5)

//=================================== Add Brand ========================
export const addBrand = async (req, res, next) => {
    const { _id } = req.authUser
    const { name } = req.body
    const { subCategoryId, categoryId } = req.query
    // check categories

    const subCategoryExists = await subCategoryModel.findById(subCategoryId)
    if (!subCategoryExists) {
        return next(new Error('invalid subCategories', { cause: 400 }))
    }

    const categoryExists = await categoryModel.findById(categoryId)

    if (!categoryExists) {
        return next(new Error('invalid categories', { cause: 400 }))
    }
    if (categoryExists._id.toString() !== subCategoryExists.categoryId.toString()) {
        return next(new Error('category and subCategory are not compatible', { cause: 400 }))
    }
    // slug
    const slug = slugify(name, {
        replacement: '_',
        lower: true,
    })
    //logo
    if (!req.file) {
        return next(new Error('please upload your logo', { cause: 400 }))
    }
    const customId = nanoid()
    const { secure_url, public_id } = await cloudinary.uploader.upload(
        req.file.path,
        {
            folder: `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}/Brands/${customId}`,
        },
    )

    req.imagePath = `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}/Brands/${customId}`
    // db
    const brandObject = {
        name,
        slug,
        logo: { secure_url, public_id },
        categoryId,
        subCategoryId,
        customId,
        createdBy: _id
    }

    const dbBrand = await brandModel.create(brandObject)
    req.failedDocument = {
        model: brandModel,
        _id: dbBrand._id
    }
    if (!dbBrand) {
        await cloudinary.uploader.destroy(public_id)
        await cloudinary.api.delete_folder(req.imagePath)
        return next(new Error('try again later', { cause: 400 }))
    }
    res.status(201).json({ message: 'CreatedDone', dbBrand })
}

// ========================================== upadte Brand ==========================================
export const updateBrand = async (req, res, next) => {
    const { brandId } = req.query
    const { name } = req.body
    const { _id } = req.authUser

    // get Brand by id 
    const isBrandExist = await brandModel.findOne({
        _id: brandId,
        createdBy: _id
    })
    if (!isBrandExist) {
        return next(new Error('invalid brand Id Or User Id', { cause: 400 }))
    }
    // get subcategory by id from Brand model
    const subCategory = await subCategoryModel.findById(isBrandExist.subCategoryId)
    if (!subCategory) {
        return next(new Error('invalid subCategory Id', { cause: 400 }))
    }

    // get category by id from Brand model
    const category = await categoryModel.findById(isBrandExist.categoryId)
    if (!category) {
        return next(new Error('invalid Category ', { cause: 400 }))
    }

    if (name) {
        // different from old name
        if (isBrandExist.name == name.toLowerCase()) {
            return next(
                new Error('please enter different name from the old Brand name', {
                    cause: 400,
                }),
            )
        }
        // unique name
        if (await brandModel.findOne({ name })) {
            return next(
                new Error('please enter different Brand name , duplicate name', {
                    cause: 400,
                }),
            )
        }

        isBrandExist.name = name
        isBrandExist.slug = slugify(name, '_')
    }

    if (req.file) {
        // delete the old brand image
        await cloudinary.uploader.destroy(isBrandExist.logo.public_id)

        // upload the new subcategory image
        const { secure_url, public_id } = await cloudinary.uploader.upload(
            req.file.path,
            {
                folder: `${process.env.PROJECT_FOLDER}/Categories/${category.customId}/subCategories/${subCategory.customId}/Brands/${isBrandExist.customId}`,
            },
        )
        isBrandExist.logo = { secure_url, public_id }
    }

    if (!name && !req.file) {
        return next(new Error('Empty Inputs Please enter requirment of API', { cause: 400, }))
    }

    isBrandExist.updatedBy = _id
    await isBrandExist.save()
    res.status(200).json({ message: 'Updated Done', isBrandExist })
}

// ========================================= delete Brand =========================
export const deleteBrand = async (req, res, next) => {
    const { brandId } = req.query
    const { _id } = req.authUser

    // get Brand by id 
    const isBrandExsit = await brandModel.findOneAndDelete({
        _id: brandId,
        createdBy: _id
    })
    if (!isBrandExsit) {
        return next(new Error('invalid brand Id', { cause: 400 }))
    }

    // get SubCategory id
    const subCategoryExists = await subCategoryModel.findByIdAndDelete(isBrandExsit.subCategoryId)
    if (!subCategoryExists) {
        return next(new Error('invalid subCategory related to Brand', { cause: 400 }))
    }

    // get category by id
    const category = await categoryModel.findById(isBrandExsit.categoryId)
    if (!category) {
        return next(new Error('invalid Category related to subCategory', { cause: 400 }))
    }

    //=========== Delete from cloudinary ==============
    await cloudinary.api.delete_resources_by_prefix(
        `${process.env.PROJECT_FOLDER}/Categories/${category.customId}/subCategories/${subCategoryExists.customId}/Brands/${isBrandExsit.customId}`,
    )

    await cloudinary.api.delete_folder(
        `${process.env.PROJECT_FOLDER}/Categories/${category.customId}/subCategories/${subCategoryExists.customId}/Brands/${isBrandExsit.customId}`,
    )

    //=========== Delete from DB ==============

    const deleteRelatedProducts = await productModel.deleteMany({
        brandId,
    })

    if (!deleteRelatedProducts.deletedCount) {
        return next(new Error('delete Brand has been Done and there are not products ', { cause: 400 }))
    }

    res.status(200).json({ messsage: 'Deleted Done' })
}

// ========================================== get all brands ==========================================
export const getAllBrands = async (req, res, next) => {
    const { page, size } = req.query

    const { limit, skip } = paginationFunction({ page, size })

    const brands = await brandModel.find()
        .limit(limit)
        .skip(skip)
        .populate([
            {
                path: 'categoryId',
                select: 'name',
            },
            {
                path: 'subCategoryId',
                select: 'name'
            },
            {
                path: 'products',
                select: "title"
            }
        ])
    res.status(200).json({ message: 'Done', brands })
}