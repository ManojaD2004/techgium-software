import express from "express";
import { UserDBv1 } from "../db/db";
import { Cookies } from "../types/auth";
import moment from "moment";
const trackRouter = express.Router();
const v1Routes = express.Router();

trackRouter.use("/v1", v1Routes);

export { trackRouter };
