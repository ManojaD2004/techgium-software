import chalk from "chalk";
import fs from "fs";
import { CameraJob } from "../types/db";
import path from "path";
import { execSync } from "child_process";

function stopJob() {
  try {
    const jobs: CameraJob[] = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), `/metadata/jobs.json`), {
        encoding: "utf8",
      })
    );
    for (const job of jobs) {
      try {
        const resExec = execSync(
          `docker container rm -f -v camera_${job.cameraId}`
        );
        console.log(
          chalk.cyanBright(
            `Killed Job of camera: ${job.cameraName}, id: ${job.cameraId}:`
          ),
          resExec.toString()
        );
      } catch (error) {
        continue;
      }
    }
    // Empty jobs
    fs.writeFileSync(
      path.join(process.cwd(), `/metadata/jobs.json`),
      JSON.stringify([], null, 2),
      { encoding: "utf8" }
    );
    return true;
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error?.message}`));
    return null;
  }
}

function getDummyJsonOutput() {
  return {
    faceDetected: false,
    timestamp: 0,
    headCount: 0,
    empIds: [],
    roomId: "",
    cameraId: "",
  };
}

export { stopJob, getDummyJsonOutput };
