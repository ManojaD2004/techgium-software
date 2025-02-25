import { NextFunction, Request, Response } from "express";
import chalk from "chalk";
import { Cookies } from "../types/auth";
import { serverConfigs } from "../configs/configs";
import { RateLimitingStoreWithRedis } from "../store/rateLimitStore";
// import { skipRoutes } from "../configs/skipRoutes";

const { RATE_LIMIT_MAX_CALL } = serverConfigs;

async function rateLimitMiddleWare(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let { userId }: Cookies = req.signedCookies;
    if (!userId) {
      userId = req.ip || "need-ip";
    }
    const rlStore = new RateLimitingStoreWithRedis();
    let rlCount = await rlStore.getCountByClerkUserId(userId);
    if (!rlCount) {
      rlCount = await rlStore.setCountByClerkUserId(userId);
      if (!rlCount) {
        res.status(400).send({
          status: "fail",
          data: {
            message:
              "Rate limiting failed, System Memory full, please try again later!",
          },
        });
        return;
      }
    }
    if (rlCount > RATE_LIMIT_MAX_CALL) {
      console.log(
        chalk.yellowBright(`Rate limiting notice for user with id ${userId}!`)
      );
      res.status(429).send({
        status: "success",
        data: {
          message:
            "Rate limiting notice, Max Request reached for this user, please try later!",
        },
      });
      return;
    }
    await rlStore.incrementCountByClerkUserId(userId);
    next();
  } catch (error) {
    console.log(error);
    res.status(400).send({
      status: "fail",
      error: error,
      data: {
        message: "Server Error!",
      },
    });
  }
}

export { rateLimitMiddleWare };
