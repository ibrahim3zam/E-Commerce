import { systemRoles } from "../../../Utils/systemRoles.js";

export const categoryAPIsRoles = {
    GET_ALL_CATEGORY: [systemRoles.USER],
    DELETE_CATEGORY: [systemRoles.ADMIN, systemRoles.SUPER_ADMIN]
}