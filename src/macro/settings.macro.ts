import { PrismaClient, SupportStuff, User } from "@prisma/client";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express, { CookieOptions, RequestHandler } from "express";
import { ValidationChain } from "express-validator";
import helmet from "helmet";
import createError from "http-errors";
import morgan from "morgan";
import NodeCache from "node-cache";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { sanitizeAndSeparateSortAndLimit } from "./middlewares/queryParam.middleware.macro.js";
import futureTime from "./utils/futureTime.util.macro.js";

interface CustomPrismaClient extends PrismaClient {
  dbModelDeterminer(reqPath: string): User | SupportStuff | undefined;
}
// ensuring env variables
if (!process.env.MONGODB_URL) throw new Error("MongoDB Connection URL is missing");
if (!process.env.JWT_SECRET) throw Error("Set JWT_SECRET in ENV variable");
if (!process.env.SERVER_PORT) throw Error("Set SERVER_PORT in ENV variable");

// defining env variables
const mongoConnectionUrl: string = process.env.MONGODB_URL;
export const jwtSecretInEnv: string = process.env.JWT_SECRET;
export const serverPort: string = process.env.SERVER_PORT;

// global rate limiter configuration
export const globalRequestLimiterConfig = new RateLimiterMemory({
  keyPrefix: "middleware",
  points: 5, // 5 points
  duration: 1 // Per second
});

const globalRateLimiterMiddleware: RequestHandler = async (req, res, next) => {
  try {
    await globalRequestLimiterConfig.consume(req.ip);
    next();
  } catch (err) {
    console.log(err);
    next(createError.TooManyRequests());
  }
};

export const globalMiddlewares: (ValidationChain[] | RequestHandler)[] = [
  helmet(),
  globalRateLimiterMiddleware,
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  }),
  // globalRequestLimiter,
  express.json(),
  cookieParser(),
  // morgan("dev"),
  ...sanitizeAndSeparateSortAndLimit
];

export function cookiePreference({
  cookiePath = "/",
  expirationTime = futureTime.inHour(3),
  secureRule = process.env.NODE_ENV === "production",
  httpOnlyRule = true,
  sameSiteRule = true
}): CookieOptions {
  return {
    path: cookiePath,
    expires: expirationTime,
    secure: secureRule,
    httpOnly: httpOnlyRule,
    sameSite: sameSiteRule
  };
}

export const memoryDB: NodeCache = new NodeCache();

// DB connection
class ExtendedPrismaClient extends PrismaClient {
  dbModelDeterminer(reqPath: string) {
    let model;
    const [, requestedPath] = reqPath.split("/");
    if (requestedPath === "users") model = this.user;
    if (requestedPath === "support-stuffs") model = this.supportStuff;
    return model;
  }
}

export const prisma: ExtendedPrismaClient = new ExtendedPrismaClient();
