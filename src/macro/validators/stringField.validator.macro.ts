import { makeFieldOptional } from "../utils/expressValidator.util.macro.js";

export const stringFieldValidator: StringField = ({ fieldName, maxLength, isOptional }) => {
  return [
    makeFieldOptional({
      optionalFlag: isOptional,
      field: fieldName
    })[0]
      .trim()
      .notEmpty()
      .withMessage(`${fieldName} can't be empty`)
      .bail()
      .isLength({ max: maxLength })
      .withMessage(`${fieldName} is longer than ${maxLength} characters`)
      .bail()
  ];
};
