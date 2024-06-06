import { categoryModel } from '../../../../DB/Models/category.model.js'
import { subCategoryModel } from '../../../../DB/Models/subCategory.model.js'
import { brandModel } from '../../../../DB/Models/brand.model.js'
import { productModel } from '../../../../DB/Models/product.model.js'
import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"
import { subCategoryType } from './subCategoryGraphqlTypies.js'
import { graphQlValidation } from '../../../Middlewares/validation.js'
import * as validators from '../subCategory.validationSchemas.js'
import cloudinary from '../../../Utils/cloudinaryConfig.js'
import { isAuthQl } from '../../../Middlewares/auth.js'
import { subCategoryAPIsRoles } from './subCategoryGraphql.endPoints.js'
import { paginationFunction } from '../../../Utils/pagination.js'

export const getAllSubCategory = {
    type: new GraphQLList(subCategoryType),
    args: {
        token: { type: new GraphQLNonNull(GraphQLString) },
        page: { type: GraphQLString } || undefined,
        size: { type: GraphQLString } || undefined
    },
    resolve: async (__, args) => {
        // ==================== auhtentication + authorization  ===============
        const isAuthUser = await isAuthQl(args.token, subCategoryAPIsRoles.GET_ALL_SUB_CATEGORY)
        if (!isAuthUser.code) {
            return isAuthUser
        }
        // =========== validation layer ===========
        const isValid = await graphQlValidation(validators.getSubCategorySchemaQL, args)
        if (isValid !== true) {
            return isValid
        }
        const { page, size } = args
        const { limit, skip } = paginationFunction({ page, size })

        const subCategories = await subCategoryModel.find()
            .limit(limit)
            .skip(skip)
            .populate([{
                path: 'Brands'

            }])
        return subCategories
    }
}

export const deleteSubCategory = {
    type: new GraphQLObjectType({
        name: "deleteSubCategoryType",
        description: "response",
        fields: {
            message: { type: GraphQLString },
        }
    }),
    args: {
        subCategoryId: { type: new GraphQLNonNull(GraphQLID) },
        token: { type: new GraphQLNonNull(GraphQLString) }
    },
    resolve: async (__, args) => {
        const { subCategoryId } = args
        // ==================== auhtentication + authorization  ===============
        const isAuthUser = await isAuthQl(args.token, subCategoryAPIsRoles.DELETE_SUB_CATEGORY)
        if (!isAuthUser.code) {
            return isAuthUser
        }
        // =========== validation layer ===========
        const isValid = await graphQlValidation(validators.deleteSubCategorySchemaQL, args)
        if (isValid !== true) {
            return isValid
        }
        // ================= logic of deleting ======================
        const subCategoryExists = await subCategoryModel.findOneAndDelete({
            _id: subCategoryId,
            createdBy: isAuthUser.findUser._id
        })
        if (!subCategoryExists) {
            return next(new Error('invalid subCategory Id or User Id', { cause: 400 }))
        }

        const categoryExists = await categoryModel.findById(subCategoryExists.categoryId)
        if (!categoryExists) {
            return {
                message: 'invalid Category related to subCategory'
            }
        }

        //=========== Delete from cloudinary ==============
        await cloudinary.api.delete_resources_by_prefix(
            `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}`,
        )

        await cloudinary.api.delete_folder(
            `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}`,
        )

        //=========== Delete from DB ==============
        const deleteRelatedBrands = await brandModel.deleteMany({
            subCategoryId,
        })
        if (!deleteRelatedBrands.deletedCount) {
            return {
                message: 'delete subCategory has been Done and there is not brand and other leaves'
            }
        }

        const deleteRelatedProducts = await productModel.deleteMany({
            subCategoryId,
        })

        if (!deleteRelatedProducts.deletedCount) {
            return {
                message: 'delete SubCategory has been Done and there are not products '
            }
        }
        return {
            message: "Delete fully is done"
        }
    }
}