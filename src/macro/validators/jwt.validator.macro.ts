import { cookie } from "express-validator";
import { prisma } from "../settings.macro.js";
import { verifyJwt } from "../utils/jwt.util.macro.js";

export const jwtInCookieValidator: MacroJwtValidator = ({ fieldName, skipisVerifiedChecking }) => {
  return [
    cookie(fieldName)
      .trim()
      .notEmpty()
      .withMessage("JWT can't be empty")
      .bail()
      .isJWT()
      .withMessage("JWT is missing in the cookie")
      .bail()
      .custom(async (jwtInReq, { req }) => {
        req.res.locals.decodedJwt = await verifyJwt(jwtInReq);
        return true;
      })
      .bail()
      .custom((_, { req }) => {
        if (req.res.locals.allowedRoleInRoute !== req.res.locals.decodedJwt.role) {
          req.res.locals.expressValidatorErrorCode = 401;
          throw new Error(`You are not ${req.res.locals.allowedRoleInRoute}`);
        } else return true;
      })
      .bail()
      .custom(async (_, { req }) => {
        // skipisVerifiedChecking is applicable for /verify route
        if (skipisVerifiedChecking) return true;
        const userStatus = await prisma.userTracker.findUnique({
          where: { userId: req.res.locals.decodedJwt?.id }
        });

        if (!userStatus?.isVerified) throw new Error("User is not verified");
        else return true;
      })
      .bail()
  ];
};
