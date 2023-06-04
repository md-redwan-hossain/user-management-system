import { stringFieldValidator } from "./stringField.validator.macro.js";

export const fullName: CustomValidationChain = ({ isOptional }) => {
  return stringFieldValidator({ fieldName: "fullName", maxLength: 50, isOptional });
};
