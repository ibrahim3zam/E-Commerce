import { systemRoles } from "../../../Utils/systemRoles.js";

export const brandAPIsRoles = {
    GET_ALL_BRAND: [systemRoles.USER],
    DELETE_BRAND: [systemRoles.ADMIN, systemRoles.SUPER_ADMIN]
}