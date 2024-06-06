import { couponModel } from '../../DB/Models/coupon.model.js'
import moment from 'moment'

export const isCouponValid = async ({ couponCode, userId, next } = {}) => {
    const coupon = await couponModel.findOne({ couponCode })
    // ================= Validation of coupon =================
    if (!coupon) {
        return next(
            new Error('please enter a valid coupon code', { cause: 400 }))
    }
    //====================== expiration ====================
    const day = moment(new Date())

    if (
        coupon.couponStatus == 'Expired' ||
        moment(new Date(coupon.toDate)).isBefore(day)
    ) {
        return next(
            new Error('coupon is expired', { cause: 400 }))
    }

    //====================== Check sarting date ====================
    if (
        coupon.couponStatus == 'Valid' &&
        moment(day).isBefore(moment(new Date(coupon.fromDate)))
    ) {
        return next(
            new Error('this coupon dose not started yet', { cause: 400 }))
    }

    let validUser = false
    for (const user of coupon.couponAssginedToUsers) {
        // coupon to user
        if (userId.toString() == user.userId.toString()) {
            validUser = true
            // ===== Check max usage ======
            if (user.maxUsage <= user.usageCount) {
                return next(
                    new Error('exceed the max usage for this coupon', { cause: 400 }))
            }
        }
    }

    if (!validUser) {
        return next(
            new Error('this coupon is not assign to this user', { cause: 400 }))
    }

    return true
}