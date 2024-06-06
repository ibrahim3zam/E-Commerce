
import { Schema, model } from 'mongoose'

const subCategorySchema = new Schema(
    {
        name: {
            type: String,
            unique: true,
            lowercase: true,
            required: true,
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            required: true,
        },
        Image: {
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
        categoryId: {
            type: Schema.Types.ObjectId,
            refPath: 'Category',
            // ref: 'Category',
            required: true,
        },
        customId: String,
    },
    {
        toObject: { virtuals: true }, // for res.json()
        toJSON: { virtuals: true }, // for console.log()s
        timestamps: true,
    },
)

//======================================== Vitruals ========================================
subCategorySchema.virtual('Brands', {
    ref: 'Brand',
    foreignField: 'subCategoryId',
    localField: '_id',
    // justOne: true,
})

export const subCategoryModel = model('subCategory', subCategorySchema)