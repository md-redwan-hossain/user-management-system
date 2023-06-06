import bcrypt from "bcrypt";
import { RequestHandler } from "express";
import createError from "http-errors";
import { nanoid } from "nanoid/async";
import { cookiePreference, memoryDB, prisma } from "../settings.macro.js";
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
  // console.log(res.locals.validatedReqData);
  const newUserInDb = await prisma.user.create({ data: res.locals.validatedReqData });

  const jwtForNewUser = (await issueJwt({
    jwtPayload: { id: newUserInDb.id, role: res.locals.allowedRoleInRoute }
  })) as IDecodedJwtPayload;

  if (newUserInDb && jwtForNewUser) {
    fireEventOnSignUp({ userId: newUserInDb.id, role: res.locals.allowedRoleInRoute });
    res.locals.jwtForSignUp = jwtForNewUser;
    res.locals.newSignedUpUser = newUserInDb;
  }

  next();
};

export const sendVerificationToken = ({ resend }: { resend: boolean }): RequestHandler => {
  return async (req, res, next) => {
    if (!res.locals.newSignedUpUser) {
      const userStatus = await prisma.userTracker.findUnique({
        where: { userId: res.locals.decodedJwt.id }
      });
      if (userStatus?.isVerified) {
        return next(createError(400, "User is already verified"));
      }
    }

    const partialTokenKey = resend ? res.locals.decodedJwt.id : res.locals.newSignedUpUser.id;

    if (memoryDB.has(`verificationToken-${partialTokenKey}`)) {
      memoryDB.del(`verificationToken-${partialTokenKey}`);
    }
    const token = await nanoid();
    const tokenValue: ValidationTokenValue = { userId: partialTokenKey, token };
    const cacheStatus = memoryDB.set(`verificationToken-${partialTokenKey}`, tokenValue, 60 * 60);
    if (cacheStatus) console.log(`Activation token: ${token}`);
    next();
  };
};

export const verifyUser: RequestHandler = async (req, res, next) => {
  const tokenKey = `verificationToken-${res.locals.decodedJwt.id}`;
  if (memoryDB.has(tokenKey)) {
    const tokenInCache = memoryDB.get(tokenKey) as ValidationTokenValue;

    if (tokenInCache.token === res.locals.validatedReqData.verificationtoken) {
      res.locals.userStatus = await prisma.userTracker.update({
        where: { userId: tokenInCache.userId },
        data: { isVerified: true }
      });
      memoryDB.del(tokenKey);
      res.status(200).json({ status: "success", message: "User is activated" });
    } else next(createError(400, "verificationToken not matched"));
  } else next(createError(400, "verificationToken not found"));
};

export const sendFortgotPasswordToken: RequestHandler = async (req, res, next) => {
  const userFromDb = await res.locals.DbModel.findUnique({
    where: { email: res.locals.validatedReqData.email }
  });
  if (!userFromDb) next(createError(404, "User not found"));
  else {
    const token = await nanoid();
    if (!memoryDB.has(`forgotPasswordToken-${token}`)) {
      const cacheStatus = memoryDB.set(`forgotPasswordToken-${token}`, userFromDb.id, 60 * 5);
      if (cacheStatus) {
        console.log(`Token for password reset: ${token}`);
        res.json({
          status: "success",
          message: "Check for password reset token in your email within 5 minute"
        });
      }
    } else {
      res.status(500).json({ status: "fail", message: "Try again." });
    }
  }
};

export const sendResetPasswordCookie: RequestHandler = async (req, res, next) => {
  if (!memoryDB.has(`forgotPasswordToken-${res.locals.validatedReqData.forgotpasswordtoken}`)) {
    next(createError(400, "forgotPasswordToken not found"));
  } else {
    const userIdFromForgotPasswordToken = memoryDB.get(
      `forgotPasswordToken-${res.locals.validatedReqData.forgotpasswordtoken}`
    );

    const resetToken = await issueJwt({
      jwtPayload: {
        id: userIdFromForgotPasswordToken,
        role: res.locals.allowedRoleInRoute
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
      .json({ status: "success", message: "send newPassword in /reset-password route" });
  }
};
