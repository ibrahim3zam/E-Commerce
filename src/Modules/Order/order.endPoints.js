import { systemRoles } from "../../Utils/systemRoles.js";

export const orderApisRoles = {
    GENERATE_ORDER: [systemRoles.USER],
    DELIVERE_ORDER: [systemRoles.ADMIN]
}
