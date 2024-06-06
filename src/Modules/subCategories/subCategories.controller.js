import slugify from 'slugify'
import { categoryModel } from '../../../DB/Models/category.model.js'
import { subCategoryModel } from '../../../DB/Models/subCategory.model.js'
import { brandModel } from '../../../DB/Models/brand.model.js'
import { productModel } from '../../../DB/Models/product.model.js'
import { customAlphabet } from 'nanoid'
import cloudinary from '../../Utils/cloudinaryConfig.js'
import { paginationFunction } from '../../Utils/pagination.js'
const nanoid = customAlphabet('123456_=!ascbhdtel', 5)

//======================================= create subCategory ==============================
export const createSubCategory = async (req, res, next) => {
    const { _id } = req.authUser
    const { categoryId } = req.query
    const { name } = req.body

    const category = await categoryModel.findById(categoryId)
    // check categoryId
    if (!category) {
        return next(new Error('invalid categoryId', { cause: 400 }))
    }

    // name is unique
    if (await subCategoryModel.findOne({ name })) {
        return next(new Error('duplicate name', { cause: 400 }))
    }
    // generat slug
    const slug = slugify(name, '_')

    // image upload
    if (!req.file) {
        return next(new Error('please upload a subcategory image', { cause: 400 }))
    }

    const customId = nanoid()
    // host
    const { secure_url, public_id } = await cloudinary.uploader.upload(
        req.file.path,
        {
            folder: `${process.env.PROJECT_FOLDER}/Categories/${category.customId}/subCategories/${customId}`,
        },
    )

    req.imagePath = `${process.env.PROJECT_FOLDER}/Categories/${category.customId}/subCategories/${customId}`
    // db
    const subCategoryObject = {
        name,
        slug,
        customId,
        Image: {
            secure_url,
            public_id,
        },
        categoryId,
        createdBy: _id
    }


    const subCategory = await subCategoryModel.create(subCategoryObject)
    req.failedDocument = {
        model: subCategoryModel,
        _id: subCategory._id
    }
    if (!subCategory) {
        await cloudinary.uploader.destroy(public_id)
        await cloudinary.api.delete_folder(req.imagePath)
        return next(new Error('try again later', { cause: 400 }))
    }
    res.status(201).json({ message: 'Added Done', subCategory })
}

// ========================================== get all subCategories with category Data ==========================================
export const getAllSubCategories = async (req, res, next) => {
    const { page, size } = req.query
    const { limit, skip } = paginationFunction({ page, size })

    const subCategories = await subCategoryModel.find()
        .limit(limit)
        .skip(skip)
        .populate([
            {
                path: 'categoryId',
                select: 'slug',
            },
            {
                path: 'Brands',
                select: 'slug'
            }
        ])
    res.status(200).json({ message: 'Done', subCategories })
}

// ========================================== upadte subCategory ==========================================
export const updateSubCategory = async (req, res, next) => {
    const { _id } = req.authUser
    const { subCategoryId } = req.query
    const { name } = req.body

    // get subcategory by id
    const subCategory = await subCategoryModel.findOne({
        _id: subCategoryId,
        createdBy: _id
    })
    if (!subCategory) {
        return next(new Error('invalid subCategory Id Or User Id', { cause: 400 }))
    }

    // get category by id
    const category = await categoryModel.findById(subCategory.categoryId)
    if (!category) {
        return next(new Error('invalid Category ', { cause: 400 }))
    }

    if (name) {
        // different from old name
        if (subCategory.name == name.toLowerCase()) {
            return next(
                new Error('please enter different name from the old subCategory name', {
                    cause: 400,
                }),
            )
        }
        // unique name
        if (await subCategoryModel.findOne({ name })) {
            return next(
                new Error('please enter different subCategory name , duplicate name', {
                    cause: 400,
                }),
            )
        }

        subCategory.name = name
        subCategory.slug = slugify(name, '_')
    }

    if (req.file) {
        // delete the old subcategory image
        await cloudinary.uploader.destroy(subCategory.Image.public_id)

        // upload the new subcategory image
        const { secure_url, public_id } = await cloudinary.uploader.upload(
            req.file.path,
            {
                folder: `${process.env.PROJECT_FOLDER}/Categories/${category.customId}/subCategories/${subCategory.customId}`,
            },
        )
        subCategory.Image = { secure_url, public_id }
    }

    if (!name && !req.file) {
        return next(new Error('Empty Inputs Please enter requirment of API', { cause: 400, }))
    }
    subCategory.updatedBy = _id
    await subCategory.save()
    res.status(200).json({ message: 'Updated Done', subCategory })
}

// ========================================= delete subCategory =========================
export const deleteSubCategory = async (req, res, next) => {
    const { _id } = req.authUser
    const { subCategoryId } = req.query

    // check SubCategory id
    const subCategoryExists = await subCategoryModel.findOneAndDelete({
        _id: subCategoryId,
        createdBy: _id
    })
    if (!subCategoryExists) {
        return next(new Error('invalid subCategory Id', { cause: 400 }))
    }

    // get category by id
    const category = await categoryModel.findById(subCategoryExists.categoryId)
    if (!category) {
        return next(new Error('invalid Category related to subCategory', { cause: 400 }))
    }

    //=========== Delete from cloudinary ==============
    await cloudinary.api.delete_resources_by_prefix(
        `${process.env.PROJECT_FOLDER}/Categories/${category.customId}/subCategories/${subCategoryExists.customId}`,
    )

    await cloudinary.api.delete_folder(
        `${process.env.PROJECT_FOLDER}/Categories/${category.customId}/subCategories/${subCategoryExists.customId}`,
    )

    //=========== Delete from DB ==============
    const deleteRelatedBrands = await brandModel.deleteMany({
        subCategoryId,
    })
    if (!deleteRelatedBrands.deletedCount) {
        return next(new Error('delete SubCategory has been Done and there is not brand and other leaves', { cause: 400 }))
    }

    const deleteRelatedProducts = await productModel.deleteMany({
        subCategoryId,
    })

    if (!deleteRelatedProducts.deletedCount) {
        return next(new Error('delete SubCategory has been Done and there are not products ', { cause: 400 }))
    }

    res.status(200).json({ messsage: 'Deleted Done' })
}