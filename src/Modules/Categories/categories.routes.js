import { Router } from 'express'
import { multerCloudFunction } from '../../Services/multerCloud.js'
import { allowedExtensions } from '../../Utils/allowedExtensions.js'
import { asyncHandler } from '../../Utils/asyncHandler.js'
import * as cc from './categories.controller.js'
import { validationCoreFunction } from '../../Middlewares/validation.js'
import * as validators from './category.validationSchemas.js'
import subCategoryRouter from '../subCategories/subCategories.routes.js'
import { isAuth } from '../../Middlewares/auth.js'
import { categoryApisRoles } from './category.endPoints.js'

const router = Router()


router.use('/:categoryId', subCategoryRouter)


router.get('/', isAuth(categoryApisRoles.GET_ALL_CATEGORY),
    validationCoreFunction(validators.getAllCategories)
    , asyncHandler(cc.getAllCategories))

router.post(
    '/create',
    isAuth(categoryApisRoles.CREAT_CATEGORY),
    multerCloudFunction(allowedExtensions.Image).single('categoryImage'),
    validationCoreFunction(validators.createCategorySchema),
    asyncHandler(cc.createCategory),
)

router.put(
    '/update',
    isAuth(categoryApisRoles.UPDATE_CATEGORY),
    multerCloudFunction(allowedExtensions.Image).single('categoryImage'),
    validationCoreFunction(validators.updateCategorySchema),
    asyncHandler(cc.updateCategory),
)

router.delete('/delete',
    isAuth(categoryApisRoles.DELETE_CATEGORY),
    validationCoreFunction(validators.deleteCategorySchema)
    , asyncHandler(cc.deleteCategory))


export default router