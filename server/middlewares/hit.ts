import chalk from "chalk";
import { NextFunction, Request, Response } from "express";

async function hitMiddleWare(req: Request, _: Response, next: NextFunction) {
  try {
    console.log(chalk.redBright(`HIT ${req.path}`));
  } catch (error) {
    console.log(error);
  } finally {
    next();
  }
}

export { hitMiddleWare };
