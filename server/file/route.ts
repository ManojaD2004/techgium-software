import express from "express";
const fileRouter = express.Router();
const v1Routes = express.Router();

v1Routes.use("/image", express.static("./public/images"));

fileRouter.use("/v1", v1Routes);

export { fileRouter };
