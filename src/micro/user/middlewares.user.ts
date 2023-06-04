import { RequestHandler } from "express";
import { ValidationChain } from "express-validator";
import { validationReport } from "../../macro/utils/expressValidator.util.macro.js";
import {
  validateEmail,
  validateLoginCredentials
} from "../../macro/validators/auth.validator.macro.js";
import { userDataValidator } from "./validators.user.js";

export const userLoginDataValidation: Array<ValidationChain[] | RequestHandler> = [
  validateLoginCredentials(),
  validationReport
];
export const userPasswordResetEmailValidation: Array<ValidationChain[] | RequestHandler> = [
  validateEmail({ isOptional: false }),
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
