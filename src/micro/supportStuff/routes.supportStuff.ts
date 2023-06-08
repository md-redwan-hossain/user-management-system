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
import { getAllUsers } from "../admin/controllers.admin.js";
import { User } from "../user/models.user.js";
import * as supportStuffMiddlewares from "./middlewares.supportStuff.js";

const supportStuffRouter: Router = express.Router();

supportStuffRouter.post(
  "/login",
  ...supportStuffMiddlewares.supportStuffLoginDataValidation,
  asyncErrorHandler(sendJwtToClient)
);
supportStuffRouter.post(
  "/signup",
  ...supportStuffMiddlewares.supportStuffSignUpDataValidation,
  asyncErrorHandler(macroCrudMiddlewares.createUser),
  asyncErrorHandler(sendVerificationToken({ resend: false })),
  asyncErrorHandler(sendJwtToClient)
);

supportStuffRouter
  .route("/profile")
  .get(
    ...roleGuardInCookie,
    asyncErrorHandler(macroCrudMiddlewares.getUser({ useObjectIdForQuery: false }))
  )
  .patch(
    ...roleGuardInCookie,
    ...supportStuffMiddlewares.supportStuffDataUpdateValidation,
    asyncErrorHandler(macroCrudMiddlewares.updateUser({ useObjectIdForQuery: false }))
  )
  .delete(
    ...roleGuardInCookie,
    asyncErrorHandler(macroCrudMiddlewares.deleteUser({ useObjectIdForQuery: false }))
  );

supportStuffRouter
  .route("/verify")
  .get(
    ...roleGuardInCookieForVerifyRoute,
    asyncErrorHandler(sendVerificationToken({ resend: true }))
  )
  .patch(
    ...roleGuardInCookieForVerifyRoute,
    ...supportStuffMiddlewares.supportStuffVerificationTokenValidation,
    asyncErrorHandler(verifyUser)
  );

supportStuffRouter.post(
  "/forgot-password",
  ...supportStuffMiddlewares.supportStuffForgotPasswordRequestValidation,
  asyncErrorHandler(sendFortgotPasswordToken)
);

supportStuffRouter
  .route("/reset-password")
  .get(
    ...supportStuffMiddlewares.supportStuffForgotPasswordTokenValidation,
    asyncErrorHandler(sendResetPasswordCookie)
  )
  .patch(
    ...supportStuffMiddlewares.supportStuffResetPasswordValidation,
    asyncErrorHandler(sendJwtToClient)
  );

supportStuffRouter
  .route("/users")
  .get(
    ...roleGuardInCookie,
    macroCrudMiddlewares.paginationDataMemoizer("totalUsersinMemoryDB", User),
    asyncErrorHandler(getAllUsers)
  );

supportStuffRouter
  .route("/users/:userId")
  .get(
    ...roleGuardInCookie,
    ...mongoIdValidation({ routeParamName: "userId" }),
    asyncErrorHandler(macroCrudMiddlewares.getUser({ useObjectIdForQuery: true }))
  )
  .patch(
    ...roleGuardInCookie,
    ...mongoIdValidation({ routeParamName: "userId" }),
    ...supportStuffMiddlewares.supportStuffOtherUserDataUpdateValidation,
    asyncErrorHandler(macroCrudMiddlewares.updateUser({ useObjectIdForQuery: true }))
  )
  .delete(
    ...roleGuardInCookie,
    ...mongoIdValidation({ routeParamName: "userId" }),
    asyncErrorHandler(macroCrudMiddlewares.deleteUser({ useObjectIdForQuery: true }))
  );

export default supportStuffRouter;
