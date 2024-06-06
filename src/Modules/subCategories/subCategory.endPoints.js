import { systemRoles } from '../../Utils/systemRoles.js'

export const subCategoryApisRoles = {
    GET_ALL_SUBCATEGORY: [systemRoles.USER],
    CREATE_SUBCATEGORY: [systemRoles.ADMIN, systemRoles.SUPER_ADMIN],
    UPDATE_SUBCATEGORY: [systemRoles.ADMIN, systemRoles.SUPER_ADMIN],
    DELETE_SUBCATEGORY: [systemRoles.ADMIN, systemRoles.SUPER_ADMIN]
}