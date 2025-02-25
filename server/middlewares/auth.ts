import chalk from "chalk";
import { NextFunction, Request, Response } from "express";
import { ClerkCache } from "../cache/redis";
import { SessionDB } from "../db/db";
import { Cookies, SessionId } from "../types/auth";
import { skipRoutes } from "../configs/skipRoutes";

async function authMiddleWare(req: Request, res: Response, next: NextFunction) {
  // if (skipRoutes.includes(req.path)) {
  //   next();
  //   return;
  // }
  let skip = false;
  for (const sr of skipRoutes) {
    if (req.path.startsWith(sr)) {
      skip = true;
      break;
    }
  }
  if (skip) {
    next();
    return;
  }
  try {
    const { sessionId, userId }: Cookies = req.signedCookies;
    // console.log(sessionId, userId);
    if (!userId || !sessionId) {
      console.log(chalk.yellow(`Auth failed need to log in!`));
      res.status(401).send({
        status: "fail",
        data: {
          message: "Please Login In!",
          redirectPage: "/sign-in",
        },
      });
      return;
    }
    const mClient = new ClerkCache();
    const sessionDb = new SessionDB();
    // Get sessionId from Redis DB
    let sessionIdValidate: SessionId = await mClient.getSessionByClerkUserId(
      userId
    );
    // If the Redis DB is offline or didnt find the sessionId
    if (sessionIdValidate === null || sessionIdValidate === -1) {
      // Get sessionId from PostgresSQL DB
      // console.log(userId, sessionId);
      const sessionIdValidateDb = await sessionDb.getSessionIdByClerkUserId(
        userId
      );
      // If the PostgresSQL DB is offline
      if (sessionIdValidateDb === null) {
        console.log(
          chalk.yellow(
            `Auth failed user: ${userId}, Redis Database and PostgresSQL Database is offline!`
          )
        );
        res.status(400).send({
          status: "fail",
          data: {
            message:
              "Redis Database and PostgresSQL Database is offline, please try again later!",
            redirectPage: "/sign-in",
          },
        });
        return;
      }
      // If the PostgresSQL DB didnt find the sessionId
      if (sessionIdValidateDb === -1) {
        console.log(
          chalk.yellow(`Auth failed user: ${userId}, need to log in!`)
        );
        res.status(401).send({
          status: "fail",
          data: {
            message: "Please Login In, didnt get the session id!",
            redirectPage: "/sign-in",
          },
        });
        return;
      }
      // Only create sessionId to Redis DB
      // if it is online and didnt find the sessionId
      if (sessionIdValidate === -1) {
        await mClient.createSessionByClerkUserId(userId, sessionIdValidateDb);
      }
      sessionIdValidate = sessionIdValidateDb;
    }

    // console.log(sessionIdValidate, " ", sessionId);
    if (sessionIdValidate !== sessionId) {
      console.log(
        chalk.yellow(
          `Auth failed user: ${userId}, session id did not match, Hacker!`
        )
      );
      res.status(401).send({
        status: "fail",
        data: {
          message: "Unauthorized user, session id did not matched, Hacker!",
          redirectPage: "/sign-up",
        },
      });
      return;
    }
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

export { authMiddleWare };
