import { GraphQLObjectType, GraphQLSchema } from "graphql";

import * as brandResolvers from './brandGraphqlResolver.js'


export const brandGraphqlSchema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: "brandQuerySchema",
        description: "response",
        fields: {
            getAllbrand: brandResolvers.getAllBrand,
        }
    }),
    mutation: new GraphQLObjectType({
        name: "brandMutationSchema",
        description: "This is main mutation schema in brand module",
        fields: {
            deleteBrand: brandResolvers.deleteBrand
        }
    })
})