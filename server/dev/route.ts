import express from "express";
// import chalk from "chalk";
// import { serverConfigs } from "../configs/configs";
// import { ClerkCache } from "../cache/redis";
// import { SessionDB } from "../db/db";
// import { v4 } from "uuid";
// import { SessionId } from "../types/auth";
const devRouter = express.Router();
const v1Routes = express.Router();

// This routes are there only in development, and should be block in production!

// Macros

devRouter.use("/v1", v1Routes);

export { devRouter };
