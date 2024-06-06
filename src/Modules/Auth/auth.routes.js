import { Router } from 'express'
const router = Router()
import * as ac from './auth.controller.js'
import { asyncHandler } from '../../Utils/asyncHandler.js'
import { validationCoreFunction } from '../../Middlewares/validation.js'
import * as validators from '../Auth/auth.validationSchemas.js'


router.post('/signUp', validationCoreFunction(validators.signUpSchema), asyncHandler(ac.signUp))
router.get('/confirm/:token', asyncHandler(ac.confirmEmail))

router.post('/logIn', validationCoreFunction(validators.logInSchema), asyncHandler(ac.logIn))
router.post('/loginWithGmail', asyncHandler(ac.loginWithGmail))

router.post('/forget', validationCoreFunction(validators.forgetPasswordSchema), asyncHandler(ac.forgetPassword))
router.post('/reset/:token', validationCoreFunction(validators.resetPasswordSchema), asyncHandler(ac.resetPassword))

export default router