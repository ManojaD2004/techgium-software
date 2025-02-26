import chalk from "chalk";
import fs from "fs";
import path from "path";
import { EmployeeData } from "../types/model";

const jsonDataPath = path.join(process.cwd(), "model_data");

function createModelData(
  roomId: number,
  date: string,
  employeeData: EmployeeData[]
) {
  try {
    const fileName = path.join(jsonDataPath, `${roomId}-${date}.json`);
    fs.writeFileSync(fileName, JSON.stringify(employeeData, null, 2), {
      encoding: "utf8",
    });
    return true;
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error?.message}`));
    return false;
  }
}

function readModelData(roomId: number, date: string) {
  try {
    const fileName = path.join(jsonDataPath, `${roomId}-${date}.json`);
    const fileData = fs.readFileSync(fileName).toString();
    const modelData: EmployeeData[] = JSON.parse(fileData);
    return modelData;
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error?.message}`));
    return null;
  }
}

export { createModelData, readModelData };
