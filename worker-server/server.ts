import chalk from "chalk";
import { app } from "./app";
import { envConfigs, serverConfigs } from "./configs/configs";
import fs from "fs";
import path from "path";
import { stopJob } from "./helpers/jobs";

async function main() {
  try {
    const PORT = process.env?.PORT || 9000;

    app.listen(PORT, async () => {
      console.log(chalk.greenBright(`Server listening to Port: ${PORT}`));
      // Init folder creation
      const pathImage = path.join(process.cwd(), "/public/images");
      if (!fs.existsSync(pathImage)) {
        fs.mkdirSync(pathImage, { recursive: true });
      }
      const pathMetadata = path.join(process.cwd(), "/metadata");
      if (!fs.existsSync(pathMetadata)) {
        fs.mkdirSync(pathMetadata, { recursive: true });
      }
      const pathModelData = path.join(process.cwd(), "/model_data");
      if (!fs.existsSync(pathModelData)) {
        fs.mkdirSync(pathModelData, { recursive: true });
      }
    });
    process.on("SIGINT", async () => {
      console.log(chalk.red("Shutting down Process..."));
      try {
        console.log(chalk.yellowBright("Cleaning up containers!"));
        stopJob();
        console.log(chalk.yellowBright("Cleaned up containers!"));
        process.exit(0);
      } catch (error: any) {
        console.log(chalk.red("Error during shutdown:"), error?.message);
        console.log(chalk.redBright("Forcefully shutting down!"));
        process.exit(1);
      }
    });
    process.on("uncaughtException", (err) => {
      console.log(chalk.red(`Uncaught Exception: ${err.message}`));
    });
    process.on("unhandledRejection", (reason) => {
      console.log(chalk.red(`Unhandled Rejection: ${reason}`));
    });
  } catch (error: any) {
    console.log("Error: ", error?.message, error?.code);
  }
}

main();
