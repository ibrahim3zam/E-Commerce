import { GraphQLObjectType, GraphQLSchema } from "graphql";

import * as categoryResolvers from './categoryGraphqlResolver.js'


export const categoryGraphqlSchema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: "categoryQuerySchema",
        description: "response",
        fields: {
            getAllCategory: categoryResolvers.getAllCategory,
        }
    }),
    mutation: new GraphQLObjectType({
        name: "categoryMutationSchema",
        description: "This is main mutation schema in category module",
        fields: {
            deleteCategory: categoryResolvers.deleteCategory
        }
    })
})