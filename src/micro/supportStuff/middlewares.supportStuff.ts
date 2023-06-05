import { RequestHandler } from "express";
import { ValidationChain } from "express-validator";
import { validationReport } from "../../macro/utils/expressValidator.util.macro.js";
import {
  passwordResetValidator,
  tokenFieldValidator,
  validateEmail,
  validateLoginCredentials
} from "../../macro/validators/auth.validator.macro.js";
import { jwtInCookieValidator } from "../../macro/validators/jwt.validator.macro.js";
import { supportStuffDataValidator } from "./validators.supportStuff.js";
import { adminOtherUserDataValidator } from "../admin/validators.admin.js";

export const supportStuffLoginDataValidation: Array<ValidationChain[] | RequestHandler> = [
  validateLoginCredentials(),
  validationReport
];
export const supportStuffSignUpDataValidation: Array<ValidationChain[] | RequestHandler> = [
  ...supportStuffDataValidator({ useForUpdate: false }),
  validationReport
];

export const supportStuffDataUpdateValidation: Array<ValidationChain[] | RequestHandler> = [
  ...supportStuffDataValidator({ useForUpdate: true }),
  validationReport
];

export const supportStuffOtherUserDataUpdateValidation: Array<ValidationChain[] | RequestHandler> =
  [...adminOtherUserDataValidator(), validationReport];

export const supportStuffForgotPasswordRequestValidation: Array<
  ValidationChain[] | RequestHandler
> = [
  validateEmail({
    isOptional: false,
    uniqueConstraint: false,
    useForPasswordReset: true,
    useForUpdateByOtherUser: false
  }),
  validationReport
];

export const supportStuffForgotPasswordTokenValidation: Array<ValidationChain[] | RequestHandler> =
  [tokenFieldValidator({ tokenName: "forgotpasswordtoken" }), validationReport];

export const supportStuffResetPasswordValidation: Array<ValidationChain[] | RequestHandler> = [
  jwtInCookieValidator({ fieldName: "passwordResetToken", skipisVerifiedChecking: true }),
  validationReport,
  passwordResetValidator(),
  validationReport
];

export const supportStuffVerificationTokenValidation: Array<ValidationChain[] | RequestHandler> = [
  tokenFieldValidator({ tokenName: "verificationtoken" }),
  validationReport
];
