import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { hitMiddleWare } from "./middlewares/hit";
import { envConfigs, pythonConfigs, serverConfigs } from "./configs/configs";
import morgan from "morgan";
import chalk from "chalk";
import { stopJob } from "./helpers/jobs";
import { execSync } from "child_process";
import { CameraJob } from "./types/db";
import path from "path";
import fs from "fs";
import { ModelFeed } from "./types/python";
import axios from "axios";

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
app.use(helmet());
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

app.post("/containers/stop", (_, res) => {
  try {
    stopJob();
    console.log(chalk.yellow(`Stopped all python containers!`));
    res.status(200).send({
      status: "success",
      data: { message: "Stopped all python containers!" },
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

const downloadImage = async (url: string) => {
  const folderPath = path.join(process.cwd(), "/public/images");
  const fileName = url.split("/").pop() || "need_file_name";
  const filePath = path.join(folderPath, fileName);
  if (fs.existsSync(filePath)) {
    return true;
  }
  try {
    const response = await axios({
      method: "GET",
      url,
      responseType: "stream",
    });
    await response.data.pipe(fs.createWriteStream(filePath));
    return true;
    // console.log(`Downloaded: ${fileName}`);
  } catch (error: any) {
    console.error(`Error downloading ${fileName}:`, error.message);
    return false;
  }
};

async function storeImages(urls: string[]) {
  try {
    for (const imgUrl of urls) {
      const res = await downloadImage(imgUrl);
      if (res == false) {
        return false;
      }
    }
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

const { KAFKA_BROKER_URL } = serverConfigs;
const { INTERVAL_SEC } = pythonConfigs;

app.post("/containers/start", async (req, res) => {
  try {
    const {
      resCams,
      jobs,
      imagesUrls,
    }: { resCams: CameraJob[]; jobs: ModelFeed[]; imagesUrls: string[][] } =
      req.body;
    for (let i = 0; i < resCams.length; i++) {
      // const commandList = commandLists[i];
      // console.log(commandList);
      const camera = resCams[i];
      const commandList = ["docker", "run"];
      const pyFileName =
        camera.modelName === "hog" ? "main_video2.py" : "main_logic2.py";
      commandList.push(
        "-p",
        `${camera.port}:5222`,
        "--name",
        `camera_${camera.cameraId}`
      );
      commandList.push(
        "-v",
        `${path.join(process.cwd(), "/public/images")}:/app/images`
      );
      commandList.push(
        "-v",
        `${path.join(process.cwd(), "/model_data")}:/app/model_data`
      );
      commandList.push(
        "-d",
        "-e",
        "PYTHONUNBUFFERED=1",
        "model-py-2",
        "python",
        pyFileName
      );
      commandList.push(
        `/app/model_data/${camera.roomId}-${camera.cameraId}.json`,
        `${camera.videoLink}`,
        `${camera.roomId}`,
        `${camera.cameraId}`,
        `${INTERVAL_SEC}`,
        KAFKA_BROKER_URL
      );
      await storeImages(imagesUrls[i]);
      fs.writeFileSync(
        path.join(
          process.cwd(),
          `/model_data/${camera.roomId}-${camera.cameraId}.json`
        ),
        JSON.stringify(jobs[i], null, 2),
        { encoding: "utf8" }
      );
      const modelJob = execSync(commandList.join(" "));
      console.log(
        chalk.yellowBright(
          `Running docker container for camera: ${camera.cameraName}, cameraId: ${camera.cameraId}...`
        )
      );
      console.log(modelJob.toString());
    }
    fs.writeFileSync(
      path.join(process.cwd(), `/metadata/jobs.json`),
      JSON.stringify(resCams, null, 2),
      { encoding: "utf8" }
    );
    console.log(chalk.yellow(`Started all python containers!`));
    res.status(200).send({
      status: "success",
      data: { message: "Started all python containers!" },
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

app.get("/containers/get", (_, res) => {
  try {
    const jobs = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), `/metadata/jobs.json`), {
        encoding: "utf8",
      })
    );
    // console.log(jobs);
    res.status(200).send({
      status: "success",
      data: { jobs },
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
    res.status(200).send({
      status: "success",
      data: {
        message: "Express JS Server is Running!",
        extra: `Serving form process ${process.pid}`,
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
