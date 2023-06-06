import { PrismaClient } from "@prisma/client";
import express, { Router } from "express";
import adminRouter from "../micro/admin/routes.admin.js";
import supportStuffRouter from "../micro/supportStuff/routes.supportStuff.js";
import userRouter from "../micro/user/routes.user.js";
import { roleModelCookiePathInjector } from "./middlewares/auth.middleware.macro.js";
import { prisma } from "./settings.macro.js";



const apiRouterV1: Router = express.Router();
apiRouterV1.use(
  "/admin",
  roleModelCookiePathInjector({
    role: "admin",
    DbModel: prisma.admin,
    cookiePath: "/api/v1/admin"
  }),
  adminRouter
);

apiRouterV1.use(
  "/support-stuff",
  roleModelCookiePathInjector({
    role: "supportStuff",
    DbModel: prisma.supportStuff,
    cookiePath: "/api/v1/support-stuff"
  }),
  supportStuffRouter
);

apiRouterV1.use(
  "/user",
  roleModelCookiePathInjector({
    role: "user",
    DbModel: prisma.user,
    cookiePath: "/api/v1/user"
  }),
  userRouter
);

export default apiRouterV1;
