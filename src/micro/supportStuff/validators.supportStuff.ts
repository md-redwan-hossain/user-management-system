import { adminDataValidator } from "../admin/validators.admin.js";

export const supportStuffDataValidator: MicroValidator = ({ useForUpdate }) => {
  return adminDataValidator({ useForUpdate });
};
