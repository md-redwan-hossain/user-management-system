import { conditonalValidationChainElem } from "../../macro/utils/expressValidator.util.macro.js";
import {
  validateChangePassword,
  validateEmail,
  validateSignUpCredentials
} from "../../macro/validators/auth.validator.macro.js";
import * as macroPersonalDataValidators from "../../macro/validators/personalData.validator.macro.js";

export const adminDataValidator: MicroValidator = ({ useForUpdate }) => {
  return [
    ...conditonalValidationChainElem({
      condition: useForUpdate,
      arrWhenTrue: [
        validateEmail({
          isOptional: true,
          uniqueConstraint: true,
          useForPasswordReset: false,
          useForUpdateByOtherUser: false
        }),
        validateChangePassword({ isOptional: true, useForUpdateByOtherUser: false })
      ],
      arrWhenFalse: [validateSignUpCredentials()]
    }),
    macroPersonalDataValidators.fullName({ isOptional: useForUpdate })
  ];
};

export const adminOtherUserDataValidator = () => {
  return [
    validateEmail({
      isOptional: true,
      uniqueConstraint: true,
      useForPasswordReset: false,
      useForUpdateByOtherUser: true
    }),
    validateChangePassword({ isOptional: true, useForUpdateByOtherUser: true }),
    macroPersonalDataValidators.fullName({ isOptional: true })
  ];
};
