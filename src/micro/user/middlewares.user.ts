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
import { userDataValidator } from "./validators.user.js";

export const userLoginDataValidation: Array<ValidationChain[] | RequestHandler> = [
  validateLoginCredentials(),
  validationReport
];

export const userSignUpDataValidation: Array<ValidationChain[] | RequestHandler> = [
  ...userDataValidator({ useForUpdate: false }),
  validationReport
];

export const userDataUpdateValidation: Array<ValidationChain[] | RequestHandler> = [
  ...userDataValidator({ useForUpdate: true }),
  validationReport
];

export const userForgotPasswordRequestValidation: Array<ValidationChain[] | RequestHandler> = [
  validateEmail({ isOptional: false, uniqueConstraint: false, useForPasswordReset: true }),
  validationReport
];

export const userForgotPasswordTokenValidation: Array<ValidationChain[] | RequestHandler> = [
  tokenFieldValidator({ tokenName: "forgotpasswordtoken" }),
  validationReport
];

export const userResetPasswordValidation: Array<ValidationChain[] | RequestHandler> = [
  jwtInCookieValidator({ fieldName: "passwordResetToken", skipisVerifiedChecking: true }),
  validationReport,
  passwordResetValidator(),
  validationReport
];

export const userVerificationTokenValidation: Array<ValidationChain[] | RequestHandler> = [
  tokenFieldValidator({ tokenName: "verificationtoken" }),
  validationReport
];
