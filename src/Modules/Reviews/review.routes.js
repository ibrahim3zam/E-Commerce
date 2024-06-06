import { Router } from 'express'

import * as rc from './review.controller.js'
import { asyncHandler } from '../../Utils/asyncHandler.js'
import * as validators from './review.validationSchemas.js'
import { validationCoreFunction } from '../../Middlewares/validation.js'
import { isAuth } from '../../Middlewares/auth.js'
import { reviewApisRoles } from './review.endPoints.js'


const router = Router()


router.post(
    '/',
    isAuth(reviewApisRoles.ADD_REVIEW),
    validationCoreFunction(validators.addReviewSchema),
    asyncHandler(rc.addReview),
)

router.get(
    '/getReviews',
    isAuth(reviewApisRoles.ADD_REVIEW),
    validationCoreFunction(validators.GetAllReviewsSchema),
    asyncHandler(rc.getAllReviews))

router.get('/listReviews', isAuth(reviewApisRoles.ADD_REVIEW), asyncHandler(rc.listReviews))


export default router