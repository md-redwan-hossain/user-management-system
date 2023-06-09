import { RequestHandler } from "express";
import createError from "http-errors";
import { nanoid } from "nanoid/async";
import { UserTracker } from "../../micro/admin/models.admin.js";
import { bullmqQueue, cookiePreference, memoryDB } from "../settings.macro.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../utils/email.utils.macro.js";
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

export const sendVerificationToken = ({ resend }: { resend: boolean }): RequestHandler => {
  return async (req, res, next) => {
    let userEmail;
    if (resend) {
      const userStatus = await UserTracker.findOne({ userId: res.locals.decodedJwt?.id });
      if (userStatus?.isVerified) return next(createError(400, "User is already verified"));
      userEmail = userStatus?.email;
      console.log(res.locals.validatedReqData);
      console.log(userEmail);
      if (res.locals.validatedReqData.email !== userEmail)
        return next(createError(400, "Invalid Email"));
    }

    const partialTokenKey = resend ? res.locals.decodedJwt.id : res.locals.newSignedUpUser._id;

    if (memoryDB.has(`verificationToken-${partialTokenKey}`)) {
      memoryDB.del(`verificationToken-${partialTokenKey}`);
    }
    const token = await nanoid();
    const tokenValue: ValidationTokenValue = { userId: partialTokenKey, token };
    const cacheStatus = memoryDB.set(`verificationToken-${partialTokenKey}`, tokenValue, 60 * 15);
    if (cacheStatus) {
      await bullmqQueue.add(
        `verificationToken-${partialTokenKey}`,
        sendVerificationEmail({
          receiver: userEmail || res.locals.newSignedUpUser.email,
          token
        })
      );
    }
    if (resend) {
      res.status(200).json({
        status: "success",
        message: "Check for activation token in your email within 15 minute"
      });
    } else {
      next();
    }
  };
};

export const verifyUser: RequestHandler = async (req, res, next) => {
  const tokenKey = `verificationToken-${res.locals.decodedJwt.id}`;
  if (memoryDB.has(tokenKey)) {
    const tokenInCache = memoryDB.get(tokenKey) as ValidationTokenValue;

    if (tokenInCache.token === res.locals.validatedReqData.verificationtoken) {
      res.locals.userStatus = await UserTracker.findOneAndUpdate(
        { userId: tokenInCache.userId },
        { isVerified: true }
      );
      memoryDB.del(tokenKey);
      res.status(200).json({ status: "success", message: "User is activated" });
    } else next(createError(400, "verificationToken not matched"));
  } else next(createError(400, "verificationToken not found"));
};

export const sendFortgotPasswordToken: RequestHandler = async (req, res, next) => {
  const userFromDb = await res.locals.DbModel.findOne({ email: res.locals.validatedReqData.email });
  if (!userFromDb) next(createError(404, "User not found"));
  else {
    const token = await nanoid();
    if (!memoryDB.has(`forgotPasswordToken-${token}`)) {
      const cacheStatus = memoryDB.set(`forgotPasswordToken-${token}`, userFromDb._id, 60 * 5);
      if (cacheStatus) {
        await sendPasswordResetEmail({ receiver: res.locals.newSignedUpUser.email, token });
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
