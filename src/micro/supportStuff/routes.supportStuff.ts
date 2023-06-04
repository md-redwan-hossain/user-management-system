import express, { Router } from "express";
import { asyncErrorHandler } from "../../macro/errorHandler.macro.js";
import { saveInDbOnSignUp } from "../../macro/middlewares/auth.middleware.macro.js";
import * as macroCrudMiddlewares from "../../macro/middlewares/crud.middleware.macro.js";
import { sendJwtToClient } from "../../macro/middlewares/jwt.middleware.macro.js";
import { mongoIdValidation } from "../../macro/middlewares/routeParam.middleware.macro.js";
import { roleGuardInCookie } from "../../macro/roleGuard.macro.js";
import { getAllUsers } from "../admin/controllers.admin.js";
import { userDataUpdateValidation } from "../user/middlewares.user.js";
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
  asyncErrorHandler(saveInDbOnSignUp),
  asyncErrorHandler(sendJwtToClient)
);

supportStuffRouter
  .route("/profile")
  .get(
    ...roleGuardInCookie,
    asyncErrorHandler(macroCrudMiddlewares.getProfileData({ useObjectIdForQuery: false }))
  )
  .patch(
    ...roleGuardInCookie,
    ...supportStuffMiddlewares.supportStuffDataUpdateValidation,
    asyncErrorHandler(macroCrudMiddlewares.updateProfileData({ useObjectIdForQuery: false }))
  )
  .delete(
    ...roleGuardInCookie,
    asyncErrorHandler(macroCrudMiddlewares.deleteProfile({ useObjectIdForQuery: false }))
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
    asyncErrorHandler(macroCrudMiddlewares.getProfileData({ useObjectIdForQuery: true }))
  )
  .patch(
    ...roleGuardInCookie,
    ...userDataUpdateValidation,
    asyncErrorHandler(macroCrudMiddlewares.updateProfileData({ useObjectIdForQuery: true }))
  )
  .delete(
    ...roleGuardInCookie,
    asyncErrorHandler(macroCrudMiddlewares.deleteProfile({ useObjectIdForQuery: true }))
  );

export default supportStuffRouter;
