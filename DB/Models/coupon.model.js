import { Schema, model } from 'mongoose'

const couponSchema = new Schema(
    {
        couponCode: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        couponAmount: {
            type: Number,
            required: true,
            default: 1,
            min: 1,
        },
        isPercentage: {
            type: Boolean,
            required: true,
            default: false,
        },
        isFixedAmount: {
            type: Boolean,
            required: true,
            default: false,
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
        couponAssginedToUsers: [
            {
                userId: {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                    required: true
                },
                maxUsage: {
                    type: Number,
                    required: true,
                    default: 1,
                },
                usageCount: {
                    type: Number,
                    default: 0,
                }
            },
        ],
        fromDate: {
            type: String,
            required: true,
        },
        toDate: {
            type: String,
            required: true,
        },
        couponStatus: {
            type: String,
            enum: ['Expired', 'Valid'],
            default: 'Valid',
        },
    },
    {
        timestamps: true,
    },
)

export const couponModel = model('Coupon', couponSchema)