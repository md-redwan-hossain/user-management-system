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
import { mongoIdValidation } from "../../macro/middlewares/routeParam.middleware.macro.js";
import { roleGuardInCookie, roleGuardInCookieForVerifyRoute } from "../../macro/roleGuard.macro.js";
import { SupportStuff } from "../supportStuff/models.supportStuff.js";
import { User } from "../user/models.user.js";
import { getAllSupportStuffs, getAllUsers } from "./controllers.admin.js";
import * as adminMiddlewares from "./middlewares.admin.js";

const adminRouter: Router = express.Router();

adminRouter.post(
  "/login",
  ...adminMiddlewares.adminLoginDataValidation,
  asyncErrorHandler(sendJwtToClient)
);
adminRouter.post(
  "/signup",
  ...adminMiddlewares.adminSignUpDataValidation,
  asyncErrorHandler(macroCrudMiddlewares.createUser),
  asyncErrorHandler(sendVerificationToken({ resend: false })),
  asyncErrorHandler(sendJwtToClient)
);

adminRouter
  .route("/profile")
  .get(
    ...roleGuardInCookie,
    asyncErrorHandler(macroCrudMiddlewares.getUser({ useObjectIdForQuery: false }))
  )
  .patch(
    ...roleGuardInCookie,
    ...adminMiddlewares.adminDataUpdateValidation,
    asyncErrorHandler(macroCrudMiddlewares.updateUser({ useObjectIdForQuery: false }))
  )
  .delete(
    ...roleGuardInCookie,
    asyncErrorHandler(macroCrudMiddlewares.deleteUser({ useObjectIdForQuery: false }))
  );

adminRouter
  .route("/verify")
  .get(
    ...roleGuardInCookieForVerifyRoute,
    ...adminMiddlewares.adminForgotPasswordRequestOrResendVerificationTokenValidation,
    asyncErrorHandler(sendVerificationToken({ resend: true }))
  )
  .patch(
    ...roleGuardInCookieForVerifyRoute,
    ...adminMiddlewares.adminVerificationTokenValidation,
    asyncErrorHandler(verifyUser)
  );

adminRouter.post(
  "/forgot-password",
  ...adminMiddlewares.adminForgotPasswordRequestOrResendVerificationTokenValidation,
  asyncErrorHandler(sendFortgotPasswordToken)
);

adminRouter
  .route("/reset-password")
  .get(
    ...adminMiddlewares.adminForgotPasswordTokenValidation,
    asyncErrorHandler(sendResetPasswordCookie)
  )
  .patch(...adminMiddlewares.adminResetPasswordValidation, asyncErrorHandler(sendJwtToClient));

adminRouter
  .route("/users")
  .get(
    ...roleGuardInCookie,
    macroCrudMiddlewares.paginationDataMemoizer("totalUsersinMemoryDB", User),
    asyncErrorHandler(getAllUsers)
  );

adminRouter
  .route("/users/:userId")
  .get(
    ...roleGuardInCookie,
    ...mongoIdValidation({ routeParamName: "userId" }),
    asyncErrorHandler(macroCrudMiddlewares.getUser({ useObjectIdForQuery: true }))
  )
  .patch(
    ...roleGuardInCookie,
    ...mongoIdValidation({ routeParamName: "userId" }),
    ...adminMiddlewares.adminOtherUserDataUpdateValidation,
    asyncErrorHandler(macroCrudMiddlewares.updateUser({ useObjectIdForQuery: true }))
  )
  .delete(
    ...roleGuardInCookie,
    ...mongoIdValidation({ routeParamName: "userId" }),
    asyncErrorHandler(macroCrudMiddlewares.deleteUser({ useObjectIdForQuery: true }))
  );

adminRouter
  .route("/support-stuffs")
  .get(
    ...roleGuardInCookie,
    macroCrudMiddlewares.paginationDataMemoizer("totalSupportStuffsinMemoryDB", SupportStuff),
    asyncErrorHandler(getAllSupportStuffs)
  );

adminRouter
  .route("/support-stuffs/:userId")
  .get(
    ...roleGuardInCookie,
    ...mongoIdValidation({ routeParamName: "userId" }),
    asyncErrorHandler(macroCrudMiddlewares.getUser({ useObjectIdForQuery: true }))
  )
  .patch(
    ...roleGuardInCookie,
    ...mongoIdValidation({ routeParamName: "userId" }),
    ...adminMiddlewares.adminOtherUserDataUpdateValidation,
    asyncErrorHandler(macroCrudMiddlewares.updateUser({ useObjectIdForQuery: true }))
  )
  .delete(
    ...roleGuardInCookie,
    ...mongoIdValidation({ routeParamName: "userId" }),
    asyncErrorHandler(macroCrudMiddlewares.deleteUser({ useObjectIdForQuery: true }))
  );

export default adminRouter;
