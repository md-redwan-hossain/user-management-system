import { Queue, QueueEvents, Worker } from "bullmq";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express, { CookieOptions, RequestHandler } from "express";
import { ValidationChain } from "express-validator";
import helmet from "helmet";
import createError from "http-errors";
import { Redis } from "ioredis";
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
if (!process.env.REDIS_URL_CACHE) throw new Error("Set REDIS_URL_CACHE in ENV variable");
if (!process.env.REDIS_URL_WORKER) throw new Error("Set REDIS_URL_WORKER in ENV variable");
if (!process.env.REDIS_URL_QUEUE) throw new Error("Set REDIS_URL_QUEUE in ENV variable");
if (!process.env.REDIS_URL_QUEUE_EVENT)
  throw new Error("Set REDIS_URL_QUEUE_EVENT in ENV variable");
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

// DB connection
export async function initDatabase(): Promise<void> {
  mongoose.connection.on("connecting", async () => {
    console.log("Connecting to DB...");
  });
  mongoose.connection.on("connected", async () => {
    console.log("DB is connected");
  });
  await mongoose.connect(mongoConnectionUrl);
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

export const serverKiller = async (terminator) => {
  const { success, code, message, error } = await terminator.terminate();
  if (!success) {
    if (code === "TIMED_OUT") console.log(message);
    if (code === "SERVER_ERROR") console.error(message, error);
    if (code === "INTERNAL_ERROR") console.error(message, error);
  } else console.log("Server is closed.");
};

// In memory cache
export const memoryDB: NodeCache = new NodeCache();

// Redis cache

const redisConnectionOptions = ({ useForBullmq }: { useForBullmq: boolean }) => {
  return {
    lazyConnect: true,
    maxRetriesPerRequest: useForBullmq ? null : 3,
    retryStrategy(times) {
      let delay;
      delay = times * 1000;
      if (times > 3) delay = false;
      return delay;
    }
  };
};
export const redisCache = new Redis(
  process.env.REDIS_URL_CACHE,
  redisConnectionOptions({ useForBullmq: false })
);
export const redisWorker = new Redis(
  process.env.REDIS_URL_WORKER,
  redisConnectionOptions({ useForBullmq: true })
);
export const redisQueue = new Redis(
  process.env.REDIS_URL_QUEUE,
  redisConnectionOptions({ useForBullmq: true })
);
export const redisQueueEvent = new Redis(
  process.env.REDIS_URL_QUEUE_EVENT,
  redisConnectionOptions({ useForBullmq: true })
);

const redisInstances = [redisCache, redisWorker, redisQueue, redisQueueEvent];

redisInstances.forEach((elem) => {
  elem.on("ready", () => {
    console.log("Redis is up");
  });

  elem.on("error", (err) => {
    console.error(`Redis Error --> ${err}`);
  });
});

// BullMQ Queue
export const bullmqQueue = new Queue("workerQueue", { connection: redisWorker });

// BullMQ Worker
const bullmqWorker = new Worker("workerQueue", async (job) => {}, { connection: redisQueue });

const queueEvents = new QueueEvents("queueEvent", { connection: redisQueueEvent });

queueEvents.on("waiting", ({ jobId }) => {
  console.log(`A job with ID ${jobId} is waiting`);
});

queueEvents.on("active", ({ jobId, prev }) => {
  console.log(`Job ${jobId} is now active; previous status was ${prev}`);
});

queueEvents.on("completed", ({ jobId, returnvalue }) => {
  console.log(`${jobId} has completed and returned ${returnvalue}`);
});

queueEvents.on("failed", ({ jobId, failedReason }) => {
  console.log(`${jobId} has failed with reason ${failedReason}`);
});

// bullmqWorker.on("completed", (job) => {
//   console.log(`${job.id} has completed!`);
// });

// bullmqWorker.on("failed", (job, err) => {
//   console.log(`${job?.id} has failed with ${err.message}`);
// });
