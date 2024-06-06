import { categoryModel } from '../../../../DB/Models/category.model.js'
import { subCategoryModel } from '../../../../DB/Models/subCategory.model.js'
import { brandModel } from '../../../../DB/Models/brand.model.js'
import { productModel } from '../../../../DB/Models/product.model.js'
import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"
import { categoryType } from './categoryGraphqlTypies.js'
import { graphQlValidation } from '../../../Middlewares/validation.js'
import * as validators from '../category.validationSchemas.js'
import cloudinary from '../../../Utils/cloudinaryConfig.js'
import { isAuthQl } from '../../../Middlewares/auth.js'
import { categoryAPIsRoles } from './categoryGraphql.endPoints.js'
import { paginationFunction } from '../../../Utils/pagination.js'


export const getAllCategory = {
    type: new GraphQLList(categoryType),
    args: {
        token: { type: new GraphQLNonNull(GraphQLString) },
        page: { type: GraphQLString } || undefined,
        size: { type: GraphQLString } || undefined
    },
    resolve: async (__, args) => {
        const { page, size } = args
        // ==================== auhtentication + authorization  ===============
        const isAuthUser = await isAuthQl(args.token, categoryAPIsRoles.GET_ALL_CATEGORY)
        if (!isAuthUser.code) {
            return isAuthUser
        }
        // =========== validation layer ===========
        const isValid = await graphQlValidation(validators.getCategorySchemaQL, args)
        if (isValid !== true) {
            return isValid
        }
        const { limit, skip } = paginationFunction({ page, size })
        const categories = await categoryModel.find()
            .limit(limit)
            .skip(skip)
            .populate([{
                path: 'subCategories',
                populate: [{
                    path: 'Brands'
                }]
            }])
        return categories
    }
}

export const deleteCategory = {
    type: new GraphQLObjectType({
        name: "deleteCategoryType",
        description: "response",
        fields: {
            message: { type: GraphQLString },
        }
    }),
    args: {
        categoryId: { type: new GraphQLNonNull(GraphQLID) },
        token: { type: new GraphQLNonNull(GraphQLString) }
    },
    resolve: async (__, args) => {
        // ==================== auhtentication + authorization  ===============
        const isAuthUser = await isAuthQl(args.token, categoryAPIsRoles.DELETE_CATEGORY)
        if (!isAuthUser.code) {
            return isAuthUser
        }
        // =========== validation layer ===========
        const isValid = await graphQlValidation(validators.deleteCategorySchemaQL, args)
        if (isValid !== true) {
            return isValid
        }
        // ================= logic of deleting ======================
        const categoryExists = await categoryModel.findOneAndDelete({
            _id: args.categoryId,
            createdBy: isAuthUser.findUser._id,
        })
        if (!categoryExists) {
            return {
                message: 'invalid categoryId Or user Id'
            }
        }

        //=========== Delete from cloudinary ==============
        await cloudinary.api.delete_resources_by_prefix(
            `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}`,
        )

        await cloudinary.api.delete_folder(
            `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}`,
        )

        //=========== Delete from DB ==============
        const deleteRelatedSubCategories = await subCategoryModel.deleteMany({
            categoryId: args.categoryId,
        })

        if (!deleteRelatedSubCategories.deletedCount) {
            return {
                message: 'delete Category has been Done and there is not subCategory and other leaves'
            }
        }
        const deleteRelatedBrands = await brandModel.deleteMany({
            categoryId: args.categoryId,
        })
        if (!deleteRelatedBrands.deletedCount) {
            return {
                message: 'delete Category has been Done and there is not brand and other leaves'
            }
        }

        const deleteRelatedProducts = await productModel.deleteMany({
            categoryId: args.categoryId,
        })

        if (!deleteRelatedProducts.deletedCount) {
            return {
                message: 'delete Category has been Done and there are not products '
            }
        }
        return {
            message: "Delete fully is done"
        }
    }
}