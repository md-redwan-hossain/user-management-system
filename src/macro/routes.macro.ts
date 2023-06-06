import express, { Router } from "express";
import { Admin } from "../micro/admin/models.admin.js";
import adminRouter from "../micro/admin/routes.admin.js";
import { SupportStuff } from "../micro/supportStuff/models.supportStuff.js";
import supportStuffRouter from "../micro/supportStuff/routes.supportStuff.js";
import { User } from "../micro/user/models.user.js";
import userRouter from "../micro/user/routes.user.js";
import { roleModelCookiePathInjector } from "./middlewares/auth.middleware.macro.js";

const apiRouterV1: Router = express.Router();
apiRouterV1.use(
  "/admin",
  roleModelCookiePathInjector({
    role: "admin",
    DbModel: Admin,
    cookiePath: "/api/v1/admin"
  }),
  adminRouter
);

apiRouterV1.use(
  "/support-stuff",
  roleModelCookiePathInjector({
    role: "supportStuff",
    DbModel: SupportStuff,
    cookiePath: "/api/v1/support-stuff"
  }),
  supportStuffRouter
);

apiRouterV1.use(
  "/user",
  roleModelCookiePathInjector({
    role: "user",
    DbModel: User,
    cookiePath: "/api/v1/user"
  }),
  userRouter
);

export default apiRouterV1;
