import { Router } from 'express'
import * as bc from './brands.controller.js'
import { asyncHandler } from '../../Utils/asyncHandler.js'
import { multerCloudFunction } from '../../Services/multerCloud.js'
import { allowedExtensions } from '../../Utils/allowedExtensions.js'
import { validationCoreFunction } from '../../Middlewares/validation.js'
import * as validators from './brand.validationSchemas.js'
import { isAuth } from '../../Middlewares/auth.js'
import { brandApisRoles } from './brand.endPoints.js'

const router = Router()




router.get('/', isAuth(brandApisRoles.GET_ALL_BRAND),
    validationCoreFunction(validators.getAllBrands)
    , asyncHandler(bc.getAllBrands))

router.post(
    '/create',
    isAuth(brandApisRoles.CREATE_BRAND),
    multerCloudFunction(allowedExtensions.Image).single('logoImage'),
    validationCoreFunction(validators.createBrandSchema),
    asyncHandler(bc.addBrand),
)

router.put(
    '/update',
    isAuth(brandApisRoles.UPDATE_BRAND),
    multerCloudFunction(allowedExtensions.Image).single('logoImage'),
    validationCoreFunction(validators.updateBrandSchema),
    asyncHandler(bc.updateBrand),
)
router.delete('/delete',
    isAuth(brandApisRoles.DELETE_BRAND),
    validationCoreFunction(validators.deleteBrandSchema)
    , asyncHandler(bc.deleteBrand))





export default router