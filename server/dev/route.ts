import express from "express";
import chalk from "chalk";
import { serverConfigs } from "../configs/configs";
import { ClerkCache } from "../cache/redis";
import { clerkClient } from "@clerk/express";
import { SessionDB } from "../db/db";
import { v4 } from "uuid";
import { SessionId } from "../types/auth";
const devRouter = express.Router();
const v1Routes = express.Router();

// This routes are there only in development, and should be block in production!

// Macros
const { SESSION_EXPIRE_TIME_IN_DAYS } = serverConfigs;

v1Routes.get("/login/:userid", async (req, res) => {
  try {
    const userId = req.params.userid;
    const mClient = new ClerkCache();
    const sessionDb = new SessionDB();
    const sessionId = v4();
    const user = await clerkClient.users.getUser(userId);
    if (user.id !== userId) {
      res.status(400).send({
        status: "fail",
        data: {
          message:
            "Please Sign up, didnt find the user id in the clerk server!",
        },
      });
      return;
    }
    let sessionIdRes: SessionId = await mClient.getSessionByClerkUserId(userId);
    if (!sessionIdRes) {
      sessionIdRes = await sessionDb.getSessionIdByAuthId(userId);
      if (!sessionIdRes) {
        res.status(400).send({
          status: "fail",
          data: {
            message:
              "PostgresSQL and Redis Database is offline, please try again later!",
            redirectPage: "/sign-in",
          },
        });
        return;
      }
    }
    if (sessionIdRes === -1) {
      sessionIdRes = await sessionDb.createSessionIdByAuthId(userId, sessionId);
      await mClient.createSessionByClerkUserId(userId, sessionId);
    }
    if (!sessionIdRes) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "PostgresSQL Database is offline, please try again later!",
          redirectPage: "/sign-in",
        },
      });
      return;
    }
    if (sessionIdRes === -1) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "PostgresSQL Database error, could not insert row!",
          redirectPage: "/sign-in",
        },
      });
      return;
    }
    res.cookie("sessionId", sessionIdRes, {
      httpOnly: true,
      secure: true,
      signed: true,
      path: "/",
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * SESSION_EXPIRE_TIME_IN_DAYS,
    });
    res.cookie("userId", userId, {
      httpOnly: true,
      secure: true,
      signed: true,
      path: "/",
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * SESSION_EXPIRE_TIME_IN_DAYS,
    });
    res.status(200).send({
      status: "success",
      data: {
        sessionId: sessionIdRes,
      },
    });
    console.log(chalk.yellow(`User: ${userId}, is logged in!`));
  } catch (error: any) {
    console.log(
      chalk.red(`Error: ${error?.message}, for user id ${req.body?.userId}`)
    );
    res.status(400).send({
      status: "fail",
      error: error,
      data: {
        message: "Internal Server Error!",
      },
    });
  }
});

devRouter.use("/v1", v1Routes);

export { devRouter };
