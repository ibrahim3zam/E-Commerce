import { systemRoles } from "../../Utils/systemRoles.js";

export const productApisRoles = {
    GET_PRODUCT: [systemRoles.USER],
    ADD_PRODUCT: [systemRoles.ADMIN, systemRoles.SUPER_ADMIN],
    UPDATE_PRODUCT: [systemRoles.ADMIN, systemRoles.SUPER_ADMIN],
    DELETE_PRODUCT: [systemRoles.ADMIN, systemRoles.SUPER_ADMIN],

}
