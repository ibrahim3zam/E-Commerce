import { systemRoles } from "../../Utils/systemRoles.js";

export const categoryApisRoles = {
    GET_ALL_CATEGORY: [systemRoles.USER],
    CREAT_CATEGORY: [systemRoles.ADMIN, systemRoles.SUPER_ADMIN],
    UPDATE_CATEGORY: [systemRoles.ADMIN, systemRoles.SUPER_ADMIN],
    DELETE_CATEGORY: [systemRoles.ADMIN, systemRoles.SUPER_ADMIN]
}