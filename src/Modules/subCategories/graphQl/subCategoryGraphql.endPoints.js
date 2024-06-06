import { systemRoles } from "../../../Utils/systemRoles.js";

export const subCategoryAPIsRoles = {
    GET_ALL_SUB_CATEGORY: [systemRoles.USER],
    DELETE_SUB_CATEGORY: [systemRoles.ADMIN, systemRoles.SUPER_ADMIN]
}