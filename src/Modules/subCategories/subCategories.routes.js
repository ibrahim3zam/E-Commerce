
import { Router } from 'express'
import * as sc from './subCategories.controller.js'
import { multerCloudFunction } from '../../Services/multerCloud.js'
import { allowedExtensions } from '../../Utils/allowedExtensions.js'
import { asyncHandler } from '../../Utils/asyncHandler.js'
import * as validators from './subCategory.validationSchemas.js'
import { validationCoreFunction } from '../../Middlewares/validation.js'
import { isAuth } from '../../Middlewares/auth.js'
import { subCategoryApisRoles } from './subCategory.endPoints.js'

const router = Router({ mergeParams: true })


router.get('/', isAuth(subCategoryApisRoles.GET_ALL_SUBCATEGORY),
    validationCoreFunction(validators.getAllSubCategories)
    , asyncHandler(sc.getAllSubCategories))

router.post(
    '/create',
    isAuth(subCategoryApisRoles.CREATE_SUBCATEGORY),
    multerCloudFunction(allowedExtensions.Image).single('subCategoryImage'),
    validationCoreFunction(validators.createSubCategorySchema),
    asyncHandler(sc.createSubCategory),
)

router.put(
    '/update',
    isAuth(subCategoryApisRoles.UPDATE_SUBCATEGORY),
    multerCloudFunction(allowedExtensions.Image).single('subCategoryImage'),
    validationCoreFunction(validators.updateSubCategorySchema),
    asyncHandler(sc.updateSubCategory),
)

router.delete('/delete',
    isAuth(subCategoryApisRoles.DELETE_SUBCATEGORY),
    validationCoreFunction(validators.deleteCategorySchema)
    , asyncHandler(sc.deleteSubCategory))




export default router

//  /category/:categoryId  => subCategoryRouter







