import bcrypt from "bcrypt";
import cryptoRandomString from "crypto-random-string";
import { RequestHandler } from "express";
import createError from "http-errors";
import { cookiePreference } from "../settings.macro.js";
import { fireEventOnSignUp } from "../utils/eventsPublisher.utils.macro.js";
import futureTime from "../utils/futureTime.util.macro.js";
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

export const fortgotPasswordToken: RequestHandler = async (req, res, next) => {
  if (res.locals.DbModel) {
    const userFromDb = res.locals.DbModel.findOne({ email: res.locals.validatedReqData.email });
    if (userFromDb) {
      const forgotToken = await issueJwt({
        jwtPayload: {
          id: userFromDb._id,
          role: res.locals.allowedRoleInRoute,
          pin: cryptoRandomString({ length: 10 }),
          forgot: true
        },
        jwtExpiration: "5m"
      });
      console.log(`Hostname: ${req.hostname}`);
      console.log(`${forgotToken}`);

      res.json({ status: "success", message: "Check for reset URL in your email" });
    } else {
      next(createError(404, "User not found"));
    }
  }
};

export const resetPasswordToken: RequestHandler = async (req, res, next) => {
  const resetToken = await issueJwt({
    jwtPayload: {
      id: res.locals.decodedJwt.id,
      role: res.locals.decodedJwt.role,
      pin: res.locals.decodedJwt.pin,
      reset: true
    },
    jwtExpiration: "5m"
  });

  res
    .cookie(
      "resetToken",
      resetToken,
      cookiePreference({
        cookiePath: res.locals.cookiePath,
        expirationTime: futureTime.inMinute(5)
      })
    )
    .status(200)
    .json({ status: "success" });
};
