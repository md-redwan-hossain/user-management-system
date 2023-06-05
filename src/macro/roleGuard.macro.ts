import { RequestHandler } from "express";
import { ValidationChain } from "express-validator";
import { access } from "fs";
import { validationReport } from "./utils/expressValidator.util.macro.js";
import { jwtInCookieValidator } from "./validators/jwt.validator.macro.js";

export const roleGuardInCookie: [ValidationChain[], RequestHandler] = [
  jwtInCookieValidator({ fieldName: "accessToken", skipisVerifiedChecking: false }),
  validationReport
];
export const roleGuardInCookieForVerifyRoute: [ValidationChain[], RequestHandler] = [
  jwtInCookieValidator({ fieldName: "accessToken", skipisVerifiedChecking: true }),
  validationReport
];
