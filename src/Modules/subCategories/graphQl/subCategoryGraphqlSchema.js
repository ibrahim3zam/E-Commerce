import { GraphQLObjectType, GraphQLSchema } from "graphql";

import * as subCategoryResolvers from './subCategoryGraphqlResolver.js'


export const subCategoryGraphqlSchema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: "subCategoryQuerySchema",
        description: "response",
        fields: {
            getAllSubCategory: subCategoryResolvers.getAllSubCategory,
        }
    }),
    mutation: new GraphQLObjectType({
        name: "subCategoryMutationSchema",
        description: "This is main mutation schema in subCategory module",
        fields: {
            deleteSubCategory: subCategoryResolvers.deleteSubCategory
        }
    })
})