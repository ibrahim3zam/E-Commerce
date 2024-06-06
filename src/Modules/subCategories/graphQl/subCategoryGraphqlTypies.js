import { GraphQLID, GraphQLList, GraphQLObjectType, GraphQLString } from "graphql";


export const imageType = new GraphQLObjectType({
    name: "imageType",
    description: "returning of a object of an image from DB",
    fields: {
        secure_url: { type: GraphQLString },
        public_id: { type: GraphQLString }
    }
})

export const brandType = new GraphQLObjectType({
    name: "brandType",
    description: "returning of brands from DB",
    fields: {
        name: { type: GraphQLString },
        slug: { type: GraphQLString },
        createdBy: { type: GraphQLID },
        logo: { type: imageType }
    }
})

export const subCategoryType = new GraphQLObjectType({
    name: "subCategoryType",
    description: "returning of subCategories from DB",
    fields: {
        name: { type: GraphQLString },
        slug: { type: GraphQLString },
        createdBy: { type: GraphQLID },
        Image: { type: imageType },
        Brands: { type: new GraphQLList(brandType) }
    }
})


