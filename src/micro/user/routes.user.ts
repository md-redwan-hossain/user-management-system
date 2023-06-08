import express, { Router } from "express";
import { asyncErrorHandler } from "../../macro/errorHandler.macro.js";
import {
  sendFortgotPasswordToken,
  sendResetPasswordCookie,
  sendVerificationToken,
  verifyUser
} from "../../macro/middlewares/auth.middleware.macro.js";
import * as macroCrudMiddlewares from "../../macro/middlewares/crud.middleware.macro.js";
import { sendJwtToClient } from "../../macro/middlewares/jwt.middleware.macro.js";
import { roleGuardInCookie, roleGuardInCookieForVerifyRoute } from "../../macro/roleGuard.macro.js";
import * as userMiddlewares from "./middlewares.user.js";

const userRouter: Router = express.Router();

userRouter.post(
  "/login",
  ...userMiddlewares.userLoginDataValidation,
  asyncErrorHandler(sendJwtToClient)
);

userRouter.post(
  "/signup",
  ...userMiddlewares.userSignUpDataValidation,
  asyncErrorHandler(macroCrudMiddlewares.createUser),
  asyncErrorHandler(sendVerificationToken({ resend: false })),
  asyncErrorHandler(sendJwtToClient)
);

userRouter
  .route("/verify")
  .get(
    ...roleGuardInCookieForVerifyRoute,
    asyncErrorHandler(sendVerificationToken({ resend: true }))
  )
  .patch(
    ...roleGuardInCookieForVerifyRoute,
    ...userMiddlewares.userVerificationTokenValidation,
    asyncErrorHandler(verifyUser)
  );

userRouter.post(
  "/forgot-password",
  ...userMiddlewares.userForgotPasswordRequestValidation,
  asyncErrorHandler(sendFortgotPasswordToken)
);

userRouter
  .route("/reset-password")
  .get(
    ...userMiddlewares.userForgotPasswordTokenValidation,
    asyncErrorHandler(sendResetPasswordCookie)
  )
  .patch(...userMiddlewares.userResetPasswordValidation, asyncErrorHandler(sendJwtToClient));

userRouter
  .route("/profile")
  .get(
    ...roleGuardInCookie,
    asyncErrorHandler(macroCrudMiddlewares.getUser({ useObjectIdForQuery: false }))
  )
  .patch(
    ...roleGuardInCookie,
    ...userMiddlewares.userDataUpdateValidation,
    asyncErrorHandler(macroCrudMiddlewares.updateUser({ useObjectIdForQuery: false }))
  )
  .delete(
    ...roleGuardInCookie,
    asyncErrorHandler(macroCrudMiddlewares.deleteUser({ useObjectIdForQuery: false }))
  );

export default userRouter;
