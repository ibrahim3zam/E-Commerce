import { Schema, model } from 'mongoose'

const brandSchema = new Schema(
    {
        name: {
            type: String,
            lowercase: true,
            required: true,
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            required: true,
        },
        logo: {
            secure_url: {
                type: String,
                required: true,
            },
            public_id: {
                type: String,
                required: true,
            },
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        subCategoryId: {
            type: Schema.Types.ObjectId,
            ref: 'subCategory',
            required: true,
        },
        categoryId: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        }
        ,
        customId: String,
    },
    {
        toObject: { virtuals: true }, // for res.json()
        toJSON: { virtuals: true },
        timestamps: true,
    },
)

brandSchema.virtual('products', {
    ref: 'Product',
    foreignField: 'brandId',
    localField: '_id',
    // justOne: true,
})

export const brandModel = model('Brand', brandSchema)