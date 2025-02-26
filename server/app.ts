import express from "express";
import cors from "cors";
import helmet from "helmet";
import { userRouter } from "./user/route";
import cookieParser from "cookie-parser";
import { authMiddleWare } from "./middlewares/auth";
import { hitMiddleWare } from "./middlewares/hit";
import { envConfigs, serverConfigs } from "./configs/configs";
import morgan from "morgan";
import chalk from "chalk";
import { MemCache } from "./cache/redis";
import { DB } from "./db/db";
import compression from "compression";
import { fileRouter } from "./file/route";

const { COOKIE_SECRET } = envConfigs;
const { CORS_ORIGIN } = serverConfigs;

// App instance - Express server
const app = express();

// Middlewares
app.set("trust proxy", 1);
// Only needed in Dev, in Prod disable this
app.use((_, res, next) => {
  res.setHeader("ngrok-skip-browser-warning", "true");
  next();
});
app.use(cookieParser(COOKIE_SECRET));
app.use(
  cors({
    credentials: true,
    origin: CORS_ORIGIN,
  })
);
app.use(hitMiddleWare);
app.use(morgan("dev"));
app.use(express.json());

// app.use(authMiddleWare);

// Routes
userRouter.use(compression());
userRouter.use(helmet());
app.use("/user", userRouter);
fileRouter.use(cors());
app.use("/file", fileRouter);

app.get("/hello", (_, res) => {
  try {
    res
      .status(200)
      .send({ status: "success", data: { message: "Hello Tiger!" } });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      status: "fail",
      error: error,
      data: {
        message: "Internal Server Error!",
      },
    });
  }
});

app.get("/verify", (req, res) => {
  try {
    const { userId } = req.signedCookies;
    console.log(chalk.yellow(`User with ${userId} is verified!`));
    res.status(200).send({
      status: "success",
      data: { message: "Yes the user is verified!" },
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      status: "fail",
      error: error,
      data: {
        message: "Internal Server Error!",
      },
    });
  }
});

app.get("/", async (req, res) => {
  try {
    const db = new DB();
    const memCache = new MemCache();
    const dbRes = await db.ping();
    await memCache.connect();
    const cacheRes = await memCache.ping();
    res.status(200).send({
      status: "success",
      data: {
        dbRes,
        cacheRes,
        message: "Express JS Server is Running!",
        extra: `Serving form process ${process.pid}`,
        cookies: req.signedCookies,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      status: "fail",
      error: error,
      data: {
        message: "Internal Server Error!",
      },
    });
  }
});

export { app };
