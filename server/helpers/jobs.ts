import chalk from "chalk";
import { ModelDBv1 } from "../db/db";
import { readModelData } from "./model-data";

async function updateModelData() {
  try {
    const modelDb = new ModelDBv1();
    const tdy = new Date();
    const tdyDate = tdy.toLocaleDateString("en-CA");
    const rooms = await modelDb.getRoomIdByDate(tdyDate);
    if (rooms === null) {
      console.log(chalk.red(`Database is offline`));
      return;
    }
    for (const room of rooms) {
      const modelData = readModelData(room.roomId, tdyDate);
    }
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error?.message}`));
  }
}
