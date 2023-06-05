import bcrypt from "bcrypt";
import { RequestHandler } from "express";
import createError from "http-errors";
import { nanoid } from "nanoid/async";
import { cookiePreference, memoryDB } from "../settings.macro.js";
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
    res.locals.newSignedUpUser = newUser;
  }
  next();
};

export const sendVerificationTokenOnSignUp: RequestHandler = async (req, res, next) => {
  const token = await nanoid();
  if (!memoryDB.has(`verificationToken-${res.locals.newSignedUpUser._id}-${token}`)) {
    const cacheStatus = memoryDB.set(
      `verificationToken-${res.locals.newSignedUpUser._id}-${token}`,
      res.locals.newSignedUpUser._id,
      60 * 60
    );
    if (cacheStatus) {
      console.log(`Activation token: ${token}`);
    }
  }
  next();
};

export const sendFortgotPasswordToken: RequestHandler = async (req, res, next) => {
  const userFromDb = res.locals.DbModel.findOne({ email: res.locals.validatedReqData.email });
  if (!userFromDb) next(createError(404, "User not found"));
  else {
    const token = await nanoid();
    if (!memoryDB.has(`forgotPasswordToken-${token}`)) {
      const cacheStatus = memoryDB.set(`forgotPasswordToken-${token}`, userFromDb._id, 60 * 5);
      if (cacheStatus) {
        console.log(`${token}`);
        res.json({
          status: "success",
          message: "Check for reset token in your email within 5 minute"
        });
      }
    } else {
      res.status(500).json({ status: "fail", message: "Try again." });
    }
  }
};

export const sendResetPasswordToken: RequestHandler = async (req, res, next) => {
  if (!memoryDB.has(`forgotPasswordToken-${res.locals.validatedReqData.forgotPasswordToken}`)) {
    createError(400, "forgotPasswordToken not found");
  } else {
    const userIdFromforgotPasswordToken = memoryDB.take(
      `forgotPasswordToken-${res.locals.validatedReqData.forgotPasswordToken}`
    );

    const resetToken = await issueJwt({
      jwtPayload: {
        id: userIdFromforgotPasswordToken,
        role: res.locals.decodedJwt.role
      },
      jwtExpiration: "5m"
    });

    res
      .cookie(
        "passwordResetToken",
        resetToken,
        cookiePreference({
          cookiePath: res.locals.cookiePath,
          expirationTime: futureTime.inMinute(5)
        })
      )
      .status(200)
      .json({ status: "success" });
  }
};
