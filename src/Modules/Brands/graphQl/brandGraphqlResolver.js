import { categoryModel } from '../../../../DB/Models/category.model.js'
import { subCategoryModel } from '../../../../DB/Models/subCategory.model.js'
import { brandModel } from '../../../../DB/Models/brand.model.js'
import { productModel } from '../../../../DB/Models/product.model.js'
import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"
import { brandType } from './brandGraphqlTypies.js'
import { graphQlValidation } from '../../../Middlewares/validation.js'
import * as validators from '../brand.validationSchemas.js'
import cloudinary from '../../../Utils/cloudinaryConfig.js'
import { isAuthQl } from '../../../Middlewares/auth.js'
import { brandAPIsRoles } from './brandGraphql.endPoints.js'
import { paginationFunction } from '../../../Utils/pagination.js'


export const getAllBrand = {
    type: new GraphQLList(brandType),
    args: {
        token: { type: new GraphQLNonNull(GraphQLString) },
        page: { type: GraphQLString } || undefined,
        size: { type: GraphQLString } || undefined
    },
    resolve: async (__, args) => {
        const { page, size } = args
        // ==================== auhtentication + authorization  ===============
        const isAuthUser = await isAuthQl(args.token, brandAPIsRoles.GET_ALL_BRAND)
        if (!isAuthUser.code) {
            return isAuthUser
        }
        // =========== validation layer ===========
        const isValid = await graphQlValidation(validators.getBrandSchemaQL, args)
        if (isValid !== true) {
            return isValid
        }
        const { limit, skip } = paginationFunction({ page, size })
        const brands = await brandModel.find()
            .limit(limit)
            .skip(skip)

        return brands
    }
}

export const deleteBrand = {
    type: new GraphQLObjectType({
        name: "deleteBrandType",
        description: "response",
        fields: {
            message: { type: GraphQLString },
        }
    }),
    args: {
        brandId: { type: new GraphQLNonNull(GraphQLID) },
        token: { type: new GraphQLNonNull(GraphQLString) }
    },
    resolve: async (__, args) => {
        const { brandId } = args
        // ==================== auhtentication + authorization  ===============
        const isAuthUser = await isAuthQl(args.token, brandAPIsRoles.DELETE_BRAND)
        if (!isAuthUser.code) {
            return isAuthUser
        }
        // =========== validation layer ===========
        const isValid = await graphQlValidation(validators.deleteBrandSchemaQL, args)
        if (isValid !== true) {
            return isValid
        }
        // ================= logic of deleting ======================
        const isBrandExsit = await brandModel.findOneAndDelete({
            _id: brandId,
            createdBy: isAuthUser.findUser._id
        })
        if (!isBrandExsit) {
            return next(new Error('invalid brand Id', { cause: 400 }))
        }

        const subCategoryExists = await subCategoryModel
            .findByIdAndDelete(isBrandExsit.subCategoryId)
        if (!subCategoryExists) {
            return next(new Error('invalid subCategory related to Brand', { cause: 400 }))
        }

        const categoryExists = await categoryModel.findByIdAndDelete(isBrandExsit.categoryId)
        if (!categoryExists) {
            return {
                message: 'invalid categoryId related to Brand'
            }
        }

        //=========== Delete from cloudinary ==============
        await cloudinary.api.delete_resources_by_prefix(
            `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}/Brands/${isBrandExsit.customId}`,
        )

        await cloudinary.api.delete_folder(
            `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}/Brands/${isBrandExsit.customId}`,
        )

        //=========== Delete from DB ==============

        const deleteRelatedProducts = await productModel.deleteMany({
            brandId,
        })

        if (!deleteRelatedProducts.deletedCount) {
            return {
                message: 'delete Brand has been Done and there are not products '
            }
        }
        return {
            message: "Delete fully is done"
        }
    }
}