import chalk from "chalk";
import express from "express";
import { ClerkCache } from "../cache/redis";
import { SessionDB, UserDBv1 } from "../db/db";
import { clerkClient } from "@clerk/express";
import { serverConfigs } from "../configs/configs";
import { v4 } from "uuid";
import { Cookies, SessionId } from "../types/auth";
import { ClerkInfo, employeeProfileSchema, UpdateNoti } from "../types/user";
const userRouter = express.Router();
const v1Routes = express.Router();

// Macros
const { SESSION_EXPIRE_TIME_IN_DAYS } = serverConfigs;

v1Routes.post("/login/employee", async (req, res) => {
  try {
    const { clerkId }: ClerkInfo = req.body;
    if (!clerkId) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "Didnt get clerk userId, please login in!",
          redirectPage: "/sign-in",
        },
      });
      return;
    }
    const mClient = new ClerkCache();
    const sessionDb = new SessionDB();
    const sessionId = v4();
    const user = await clerkClient.users.getUser(clerkId);
    if (user.id !== clerkId) {
      res.status(401).send({
        status: "fail",
        data: {
          message:
            "Please Sign up, didnt find the user id in the clerk server!",
        },
      });
      return;
    }
    let sessionIdRes: SessionId = await mClient.getSessionByClerkUserId(clerkId);
    if (!sessionIdRes || sessionIdRes === -1) {
      let sessionIdResDb: SessionId = await sessionDb.getSessionIdByClerkUserId(
        clerkId
      );
      if (!sessionIdResDb) {
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
      if (sessionIdResDb === -1) {
        sessionIdResDb = await sessionDb.createSessionIdByClerkUserId(
          clerkId,
          sessionId
        );
        await mClient.createSessionByClerkUserId(clerkId, sessionId);
      }
      if (!sessionIdResDb) {
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
      if (sessionIdResDb === -1) {
        res.status(400).send({
          status: "fail",
          data: {
            message: "PostgresSQL error, please try again later!",
            redirectPage: "/sign-in",
          },
        });
        return;
      }
      sessionIdRes = sessionIdResDb;
    }
    res.cookie("sessionId", sessionIdRes, {
      httpOnly: true,
      secure: true,
      signed: true,
      path: "/",
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * SESSION_EXPIRE_TIME_IN_DAYS,
    });
    res.cookie("clerkId", clerkId, {
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

v1Routes.post("/create/employee", async (req, res) => {
  try {
    const { clerkId }: Cookies = req.signedCookies;
    if (!clerkId) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "Didnt find cookies, please login in!",
          redirectPage: "/sign-in",
        },
      });
      return;
    }
    const userDb = new UserDBv1();
    const imgURL = `https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_640.png`;
    const employeeData = employeeProfileSchema.parse(req.body);
    const resDb = await userDb.createEmployeeUser(
      employeeData,
      clerkId,
      imgURL
    );
    if (resDb === -1 || resDb === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "Could not insert employee data, or the database is offline",
          redirectPage: "/onboarding",
        },
      });
      return;
    }
    res.status(400).send({
      status: "success",
      data: {
        ...resDb,
      },
    });
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

v1Routes.get("/onboarding", async (req, res) => {
  try {
    const { userId }: Cookies = req.signedCookies;
    if (!userId) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "Didnt find cookies, please login in!",
          redirectPage: "/sign-in",
        },
      });
      return;
    }
    const userDb = new UserDBv1();
    const dbRes = await userDb.getUserInfoByUserId(parseInt(userId));
    if (!dbRes) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "PostgresSQL Database is offline, please try again later!",
        },
      });
      return;
    }
    if (dbRes === -1) {
      res.status(200).send({
        status: "success",
        data: {
          message:
            "Didnt find any data for the given clerk user id. Please onboard!",
          onboarding: true,
        },
      });
      return;
    }
    res.status(200).send({
      status: "success",
      data: {
        userData: dbRes,
        onboarding: false,
      },
    });
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

userRouter.use("/v1", v1Routes);

export { userRouter };
