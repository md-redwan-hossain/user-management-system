import express, { Router } from "express";
import { asyncErrorHandler } from "../../macro/errorHandler.macro.js";
import { saveInDbOnSignUp } from "../../macro/middlewares/auth.middleware.macro.js";
import * as macroCrudMiddlewares from "../../macro/middlewares/crud.middleware.macro.js";
import { sendJwtToClient } from "../../macro/middlewares/jwt.middleware.macro.js";
import { mongoIdValidation } from "../../macro/middlewares/routeParam.middleware.macro.js";
import { roleGuardInCookie } from "../../macro/roleGuard.macro.js";
import { supportStuffDataUpdateValidation } from "../supportStuff/middlewares.supportStuff.js";
import { userDataUpdateValidation } from "../user/middlewares.user.js";
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
    ...userDataUpdateValidation,
    asyncErrorHandler(macroCrudMiddlewares.updateProfileData({ useObjectIdForQuery: true }))
  )
  .delete(
    ...roleGuardInCookie,
    asyncErrorHandler(macroCrudMiddlewares.deleteProfile({ useObjectIdForQuery: true }))
  );

adminRouter
  .route("/support-stuffs")
  .get(
    ...roleGuardInCookie,
    macroCrudMiddlewares.paginationDataMemoizer("totalSupportStuffsinMemoryDB", User),
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
    ...supportStuffDataUpdateValidation,
    asyncErrorHandler(macroCrudMiddlewares.updateProfileData({ useObjectIdForQuery: true }))
  )
  .delete(
    ...roleGuardInCookie,
    asyncErrorHandler(macroCrudMiddlewares.deleteProfile({ useObjectIdForQuery: true }))
  );

export default adminRouter;
