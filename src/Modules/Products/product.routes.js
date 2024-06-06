import { Router } from 'express'
const router = Router()
import * as pc from './products.controller.js'
import { asyncHandler } from '../../Utils/asyncHandler.js'
import { multerCloudFunction } from '../../Services/multerCloud.js'
import { allowedExtensions } from '../../Utils/allowedExtensions.js'
import { validationCoreFunction } from '../../Middlewares/validation.js'
import * as validators from './product.validationSchemas.js'
import { isAuth } from '../../Middlewares/auth.js'
import { productApisRoles } from './product.endPoints.js'


router.get('/', isAuth(productApisRoles.GET_PRODUCT), validationCoreFunction(validators.GetAllProductSchema), asyncHandler(pc.getAllProd))

router.get('/title', isAuth(productApisRoles.GET_PRODUCT), validationCoreFunction(validators.GetSpecificProductSchema), asyncHandler(pc.getProductsByTitle))

router.get('/listProducts', isAuth(productApisRoles.GET_PRODUCT), asyncHandler(pc.listProducts))

router.post(
    '/add',
    isAuth(productApisRoles.ADD_PRODUCT),
    multerCloudFunction(allowedExtensions.Image).array('productImage', 3),
    validationCoreFunction(validators.AddProductSchema),
    asyncHandler(pc.addProduct),
)

router.put(
    '/update'
    , isAuth(productApisRoles.UPDATE_PRODUCT),
    multerCloudFunction(allowedExtensions.Image).array('productImage', 3),
    validationCoreFunction(validators.updateProductSchema),
    asyncHandler(pc.updateProduct),
)

router.delete('/delete', isAuth(productApisRoles.DELETE_PRODUCT), validationCoreFunction(validators.DeleteProductSchema), asyncHandler(pc.deleteProduct))
export default router