import express, { Router } from "express";
import { asyncErrorHandler } from "../../macro/errorHandler.macro.js";
import {
  saveInDbOnSignUp,
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
  asyncErrorHandler(saveInDbOnSignUp),
  asyncErrorHandler(sendVerificationToken({ resendToken: false })),
  asyncErrorHandler(sendJwtToClient)
);

adminRouter
  .route("/profile")
  .get(
    ...roleGuardInCookie,
    asyncErrorHandler(macroCrudMiddlewares.getProfileData({ useObjectIdForQuery: false }))
  )
  .patch(
    ...roleGuardInCookie,
    ...adminMiddlewares.adminDataUpdateValidation,
    asyncErrorHandler(macroCrudMiddlewares.updateProfileData({ useObjectIdForQuery: false }))
  )
  .delete(
    ...roleGuardInCookie,
    asyncErrorHandler(macroCrudMiddlewares.deleteProfile({ useObjectIdForQuery: false }))
  );

adminRouter
  .route("/verify")
  .get(
    ...roleGuardInCookieForVerifyRoute,
    asyncErrorHandler(sendVerificationToken({ resendToken: true }))
  )
  .patch(
    ...roleGuardInCookieForVerifyRoute,
    ...adminMiddlewares.adminVerificationTokenValidation,
    asyncErrorHandler(verifyUser)
  );

adminRouter.post(
  "/forgot-password",
  ...adminMiddlewares.adminForgotPasswordRequestValidation,
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
    asyncErrorHandler(macroCrudMiddlewares.getProfileData({ useObjectIdForQuery: true }))
  )
  .patch(
    ...roleGuardInCookie,
    ...mongoIdValidation({ routeParamName: "userId" }),
    ...adminMiddlewares.adminOtherUserDataUpdateValidation,
    asyncErrorHandler(macroCrudMiddlewares.updateProfileData({ useObjectIdForQuery: true }))
  )
  .delete(
    ...roleGuardInCookie,
    ...mongoIdValidation({ routeParamName: "userId" }),
    asyncErrorHandler(macroCrudMiddlewares.deleteProfile({ useObjectIdForQuery: true }))
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
    asyncErrorHandler(macroCrudMiddlewares.getProfileData({ useObjectIdForQuery: true }))
  )
  .patch(
    ...roleGuardInCookie,
    ...mongoIdValidation({ routeParamName: "userId" }),
    ...adminMiddlewares.adminOtherUserDataUpdateValidation,
    asyncErrorHandler(macroCrudMiddlewares.updateProfileData({ useObjectIdForQuery: true }))
  )
  .delete(
    ...roleGuardInCookie,
    ...mongoIdValidation({ routeParamName: "userId" }),
    asyncErrorHandler(macroCrudMiddlewares.deleteProfile({ useObjectIdForQuery: true }))
  );

export default adminRouter;
