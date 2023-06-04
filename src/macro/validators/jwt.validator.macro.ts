import { ValidationChain, cookie, header } from "express-validator";
import { UserTracking } from "../../micro/admin/models.admin.js";
import { verifyJwt } from "../utils/jwt.util.macro.js";

export const jwtInCookieValidator = (): ValidationChain[] => {
  return [
    cookie("accessToken")
      .isJWT()
      .withMessage("JWT is missing in the cookie.")
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
        req.res.locals.userStatus = await UserTracking.findOne({
          userId: req.res.locals.decodedJwt?.id
        });
        if (req.res.locals.userStatus?.isBanned) throw new Error("User is banned");
        if (!req.res.locals.userStatus?.isVerified) throw new Error("User is not verified");
        if (req.res.locals.userStatus?.isDeactivated)
          throw new Error("User is deactivated. Login to active again");
        else return true;
      })
      .bail()
  ];
};

export const passwordResetTokenValidator = (): ValidationChain[] => {
  return [
    header("passwordResetToken")
      .trim()
      .notEmpty()
      .withMessage("passwordResetToken can't be empty")
      .isJWT()
      .withMessage("Invalid passwordResetToken")
      .bail()
      .custom(async (jwtInReq, { req }) => {
        const verifyFlag = await verifyJwt(jwtInReq);
      })
      .bail()
      .custom((_, { req }) => {
        if (req.res.locals.allowedRoleInRoute !== req.res.locals.decodedJwt.role) {
          req.res.locals.expressValidatorErrorCode = 401;
          throw new Error(`You are not ${req.res.locals.allowedRoleInRoute}`);
        } else return true;
      })
  ];
};
