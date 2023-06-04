import bcrypt from "bcrypt";
import cryptoRandomString from "crypto-random-string";
import { RequestHandler } from "express";
import createError from "http-errors";
import { fireEventOnSignUp } from "../utils/eventsPublisher.utils.macro.js";
import { issueJwt } from "../utils/jwt.util.macro.js";

export const roleModelCookiePathInjector = ({
  role,
  DbModel,
  cookiePath
}: IRoleModelCookiePathInjector): RequestHandler => {
  return (req, res, next) => {
    res.locals.allowedRoleInRoute = role;
    res.locals.DbModel = DbModel;
    res.locals.cookiePath = cookiePath;
    next();
  };
};

export const saveInDbOnSignUp: RequestHandler = async (req, res, next) => {
  if (res.locals.DbModel) {
    // hash the given password in the request
    res.locals.validatedReqData.password = await bcrypt.hash(
      res.locals.validatedReqData.password,
      10
    );

    const newUser = new res.locals.DbModel(res.locals.validatedReqData);

    const jwtForNewUser = (await issueJwt({
      jwtPayload: { id: newUser._id, role: res.locals.allowedRoleInRoute }
    })) as string;

    const newUserInDb = await newUser.save();

    if (newUserInDb && jwtForNewUser) {
      fireEventOnSignUp({ userId: newUser._id, role: res.locals.allowedRoleInRoute });
      res.locals.jwtForSignUp = jwtForNewUser;
    }
    next();
  }
};

export const resetPasswordToken: RequestHandler = async (req, res, next) => {
  if (res.locals.DbModel) {
    const userFromDb = res.locals.DbModel.findOne({ email: res.locals.validatedReqData.email });
    if (userFromDb) {
      const resetToken = await issueJwt({
        jwtPayload: {
          id: userFromDb._id,
          role: res.locals.allowedRoleInRoute,
          reset: true
        },
        jwtExpiration: "5m"
      });

      console.log(`${resetToken}`);

      res.json({ status: "success", message: "Check for reset URL in your email" });
    } else {
      next(createError(404, "User not found"));
    }
  }
};
