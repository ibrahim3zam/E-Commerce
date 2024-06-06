import { Router } from 'express'
const router = Router()
import * as oc from './order.controller.js'
import { asyncHandler } from '../../Utils/asyncHandler.js'
import { isAuth } from '../../Middlewares/auth.js'
import { validationCoreFunction } from '../../Middlewares/validation.js'
import * as validator from './order.validationSchemas.js'
import { orderApisRoles } from './order.endPoints.js'


router.post(
    '/',
    isAuth(orderApisRoles.GENERATE_ORDER),
    validationCoreFunction(validator.CreateOrderSchema),
    asyncHandler(oc.createOrder))

router.post(
    '/fromCartToOrder',
    isAuth(orderApisRoles.GENERATE_ORDER),
    validationCoreFunction(validator.FromCartToOrderSchema),
    asyncHandler(oc.fromCartoOrder))


router.put('/successOrder', asyncHandler(oc.successPayment))

router.patch('/cancelOrder', asyncHandler(oc.cancelPayment))

router.patch(
    '/delivered',
    isAuth(orderApisRoles.DELIVERE_ORDER),
    validationCoreFunction(validator.DeliveredSchema),
    asyncHandler(oc.deliverOrder)
)
export default router