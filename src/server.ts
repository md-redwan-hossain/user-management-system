import express, { Application } from "express";
import { Server } from "http";
import mongoose from "mongoose";
import * as macroErrorHandlers from "./macro/errorHandler.macro.js";
import apiRouterV1 from "./macro/routes.macro.js";
import { globalMiddlewares, initDatabase, serverPort } from "./macro/settings.macro.js";
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

initDatabase()
  .then(() => {
    const nodeWebServer: Server = app.listen(serverPort, async () => {
      console.log("Server is up");
    });

    process.on(
      "unhandledRejection",
      macroErrorHandlers.uncaughtPromiseRejectionHandler(nodeWebServer)
    );

    mongoose.connection.on("error", (err) => {
      console.error(`Non-Initial DB Error --> ${err}`);
      nodeWebServer.close(() => {
        console.log("Server is closed");
      });
    });
  })
  .catch((err) => {
    console.error(`Initial DB Error --> ${err}`);
  });
