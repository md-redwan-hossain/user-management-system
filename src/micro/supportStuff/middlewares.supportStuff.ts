import { RequestHandler } from "express";
import { ValidationChain } from "express-validator";
import { validationReport } from "../../macro/utils/expressValidator.util.macro.js";
import { validateLoginCredentials } from "../../macro/validators/auth.validator.macro.js";
import { supportStuffDataValidator } from "./validators.supportStuff.js";

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
