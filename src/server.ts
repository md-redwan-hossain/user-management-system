import express, { Application } from "express";
import { Server } from "http";
import httpTerminator from "lil-http-terminator";
import mongoose from "mongoose";
import * as macroErrorHandlers from "./macro/errorHandler.macro.js";
import apiRouterV1 from "./macro/routes.macro.js";
import {
  globalMiddlewares,
  initDatabase,
  redisCache,
  serverKiller,
  serverPort
} from "./macro/settings.macro.js";
import { validationReport } from "./macro/utils/expressValidator.util.macro.js";
import { updateRequestValidator } from "./macro/validators/global.validator.macro.js";

process.on("uncaughtException", macroErrorHandlers.uncaughtExceptionHandler);

const app: Application = express();

// reverse proxy
app.set("trust proxy", true);

app.use(...globalMiddlewares);
app.patch("*", updateRequestValidator(), validationReport);
app.use("/api/v1", apiRouterV1);
app.use(macroErrorHandlers.globalErrorHandler);

// 404 response for non-existent endpoints
app.all("*", macroErrorHandlers.nonExistenceRouteHandler);

(async () => {
  try {
    await initDatabase();
    const nodeWebServer: Server = app.listen(serverPort, async () => {
      console.log("Server is up");
    });

    const terminator = httpTerminator({
      server: nodeWebServer,
      gracefulTerminationTimeout: 1000,
      maxWaitTimeout: 30000
    });

    process.on(
      "unhandledRejection",
      macroErrorHandlers.uncaughtPromiseRejectionHandler(terminator)
    );

    await redisCache.connect();

    redisCache.on("end", async () => {
      console.log("Redis is down.");
      serverKiller(terminator);
    });

    mongoose.connection.on("disconnected", async () => {
      console.error(`DB is down.`);
      serverKiller(terminator);
    });
    mongoose.connection.on("error", async (err) => {
      console.error(`Non-Initial DB Error --> ${err}`);
      serverKiller(terminator);
    });
  } catch (err) {
    console.error(`${err}`);
  }
})();
