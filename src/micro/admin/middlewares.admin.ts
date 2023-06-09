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
import { adminDataValidator, adminOtherUserDataValidator } from "./validators.admin.js";

export const adminLoginDataValidation: Array<ValidationChain[] | RequestHandler> = [
  validateLoginCredentials(),
  validationReport
];
export const adminSignUpDataValidation: Array<ValidationChain[] | RequestHandler> = [
  ...adminDataValidator({ useForUpdate: false }),
  validationReport
];

export const adminDataUpdateValidation: Array<ValidationChain[] | RequestHandler> = [
  ...adminDataValidator({ useForUpdate: true }),
  validationReport
];

export const adminOtherUserDataUpdateValidation: Array<ValidationChain[] | RequestHandler> = [
  ...adminOtherUserDataValidator(),
  validationReport
];

export const adminForgotPasswordRequestOrResendVerificationTokenValidation: Array<
  ValidationChain[] | RequestHandler
> = [
  validateEmail({
    isOptional: false,
    uniqueConstraint: false,
    useForPasswordResetOrUserVerification: true,
    useForUpdateByOtherUser: false
  }),
  validationReport
];

export const adminForgotPasswordTokenValidation: Array<ValidationChain[] | RequestHandler> = [
  tokenFieldValidator({ tokenName: "forgotpasswordtoken" }),
  validationReport
];

export const adminResetPasswordValidation: Array<ValidationChain[] | RequestHandler> = [
  jwtInCookieValidator({ fieldName: "passwordResetToken", skipisVerifiedChecking: true }),
  validationReport,
  passwordResetValidator(),
  validationReport
];

export const adminVerificationTokenValidation: Array<ValidationChain[] | RequestHandler> = [
  tokenFieldValidator({ tokenName: "verificationtoken" }),
  validationReport
];
