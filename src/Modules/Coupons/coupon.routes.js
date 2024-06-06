import { Router } from 'express'
const router = Router()
import * as cc from './coupons.controller.js'
import { asyncHandler } from '../../Utils/asyncHandler.js'
import { validationCoreFunction } from '../../Middlewares/validation.js'
import * as validator from './coupon.validationSchemas.js'
import { isAuth } from '../../Middlewares/auth.js'
import { couponApisRoles } from './coupon.endPoints.js'


router.use(isAuth(couponApisRoles.COUPON_ROLES))

router.post(
    '/create',
    validationCoreFunction(validator.addCouponSchema),
    asyncHandler(cc.addCoupon),
)
router.put('/update',
    validationCoreFunction(validator.updateCouponSchema),
    asyncHandler(cc.UpdateCoupon))

router.delete(
    '/delete',
    validationCoreFunction(validator.deleteCouponSchem),
    asyncHandler(cc.deleteCoupon),
)

export default router