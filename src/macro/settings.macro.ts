import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express, { CookieOptions, RequestHandler } from "express";
import { ValidationChain } from "express-validator";
import helmet from "helmet";
import createError from "http-errors";
import mongoose from "mongoose";
import morgan from "morgan";
import NodeCache from "node-cache";
import nodemailer from "nodemailer";
import mg from "nodemailer-mailgun-transport";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { sanitizeAndSeparateSortAndLimit } from "./middlewares/queryParam.middleware.macro.js";
import futureTime from "./utils/futureTime.util.macro.js";

// ensuring env variables
if (!process.env.MONGODB_URL) throw new Error("MongoDB Connection URL is missing");
if (!process.env.JWT_SECRET) throw Error("Set JWT_SECRET in ENV variable");
if (!process.env.SERVER_PORT) throw Error("Set SERVER_PORT in ENV variable");
if (!process.env.MAILGUN_API_KEY) throw Error("Set MAILGUN_API_KEY in ENV variable");
if (!process.env.MAILGUN_DOMAIN) throw Error("Set MAILGUN_DOMAIN in ENV variable");
if (!process.env.EMAIL_DOMAIN) throw Error("Set EMAIL_DOMAIN in ENV variable");

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
export async function initDatabase(): Promise<void> {
  console.log("Connecting to DB...");
  await mongoose.connect(mongoConnectionUrl);
  console.log("DB is connected");
}

// Email configuration
const mailgunAuth = {
  auth: {
    api_key: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN
  }
};

export const nodemailerMailgun = nodemailer.createTransport(mg(mailgunAuth));

export const emailConfig = ({ receiver, subject, body }) => {
  return {
    from: `AMC ${process.env.EMAIL_DOMAIN}`,
    to: receiver,
    subject: subject,
    html: body
  };
};
