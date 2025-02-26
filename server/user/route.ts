import chalk from "chalk";
import express from "express";
import { ClerkCache, MemCache } from "../cache/redis";
import { ModelDBv1, SessionDB, TrackerDBv1, UserDBv1 } from "../db/db";
import { clerkClient } from "@clerk/express";
import { serverConfigs } from "../configs/configs";
import { v4 } from "uuid";
import { Cookies, SessionId } from "../types/auth";
import {
  adminProfileSchema,
  ClerkInfo,
  employeeProfileSchema,
  UpdateNoti,
} from "../types/user";
import { roomSchema } from "../types/model";
const userRouter = express.Router();
const v1Routes = express.Router();
const adminRoutes = express.Router();

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
    let sessionIdRes: SessionId = await mClient.getSessionByClerkUserId(
      clerkId
    );
    if (!sessionIdRes || sessionIdRes === -1) {
      let sessionIdResDb: SessionId = await sessionDb.getSessionIdByAuthId(
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
        sessionIdResDb = await sessionDb.createSessionIdByAuthId(
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
    res.cookie("authId", clerkId, {
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
    console.log(chalk.yellow(`User: ${clerkId}, is logged in!`));
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

v1Routes.post("/login/admin", async (req, res) => {
  try {
    const { userName, password }: { userName: string; password: string } =
      req.body;
    const userDb = new UserDBv1();
    const verify = await userDb.verifyAdminUser(userName, password);
    if (verify === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "PostgresSQL Database is offline, please try again later!",
        },
      });
      return;
    }
    if (verify === -1) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "Wrong username and password!",
        },
      });
      return;
    }
    const mClient = new ClerkCache();
    const sessionDb = new SessionDB();
    const sessionId = v4();
    let sessionIdRes: SessionId = await mClient.getSessionByClerkUserId(
      userName
    );
    if (!sessionIdRes || sessionIdRes === -1) {
      let sessionIdResDb: SessionId = await sessionDb.getSessionIdByAuthId(
        userName
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
        sessionIdResDb = await sessionDb.createSessionIdByAuthId(
          userName,
          sessionId
        );
        await mClient.createSessionByClerkUserId(userName, sessionId);
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
    res.cookie("authId", userName, {
      httpOnly: true,
      secure: true,
      signed: true,
      path: "/",
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * SESSION_EXPIRE_TIME_IN_DAYS,
    });
    res.cookie("userId", verify.primaryId, {
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
    console.log(chalk.yellow(`User: ${userName}, is logged in!`));
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
    const { authId }: Cookies = req.signedCookies;
    // console.log(req.signedCookies);
    if (!authId) {
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
    const resDb = await userDb.createEmployeeUser(employeeData, imgURL);
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
    res.status(200).send({
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

v1Routes.post("/create/admin", async (req, res) => {
  try {
    const userDb = new UserDBv1();
    const imgURL = `https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_640.png`;
    const employeeData = adminProfileSchema.parse(req.body);
    const resDb = await userDb.createAdminUser(employeeData, imgURL);
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
    res.cookie("userId", resDb.primaryId, {
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

adminRoutes.post("/create/room", async (req, res) => {
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
    const primaryId = parseInt(userId);
    const room = roomSchema.parse(req.body);
    const resDb = await userDb.getUserInfoByUserId(primaryId);
    if (resDb === -1 || resDb === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "Could not get data, or the database is offline",
          redirectPage: "/onboarding",
        },
      });
      return;
    }
    if (resDb.userType !== "admin") {
      res.status(400).send({
        status: "fail",
        data: {
          message: "You are not admin. Contact your admin to create room.",
        },
      });
      return;
    }
    const trackerDb = new TrackerDBv1();
    const resRoom = await trackerDb.createRoom(room.roomName, primaryId);
    if (resRoom === -1 || resRoom === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "Could not insert room data, or the database is offline",
          redirectPage: "/onboarding",
        },
      });
      return;
    }
    res.status(200).send({
      status: "success",
      data: {
        ...resRoom,
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

adminRoutes.get("/get/room", async (req, res) => {
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
    const primaryId = parseInt(userId);
    const resDb = await userDb.getUserInfoByUserId(primaryId);
    if (resDb === -1 || resDb === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "Could not get data, or the database is offline",
          redirectPage: "/onboarding",
        },
      });
      return;
    }
    if (resDb.userType !== "admin") {
      res.status(400).send({
        status: "fail",
        data: {
          message: "You are not admin. Contact your admin to create room.",
        },
      });
      return;
    }
    const trackerDb = new TrackerDBv1();
    const resRooms = await trackerDb.getRooms();
    if (resRooms === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "Could not insert room data, or the database is offline",
          redirectPage: "/onboarding",
        },
      });
      return;
    }
    res.status(200).send({
      status: "success",
      data: {
        rooms: resRooms,
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

adminRoutes.post("/assign/camera", async (req, res) => {
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
    const primaryId = parseInt(userId);
    const { cameraName, roomId }: { cameraName: string; roomId: number } =
      req.body;
    const resDb = await userDb.getUserInfoByUserId(primaryId);
    if (resDb === -1 || resDb === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "Could not get data, or the database is offline",
          redirectPage: "/onboarding",
        },
      });
      return;
    }
    if (resDb.userType !== "admin") {
      res.status(400).send({
        status: "fail",
        data: {
          message: "You are not admin. Contact your admin to create room.",
        },
      });
      return;
    }
    const trackerDb = new TrackerDBv1();
    const resCamera = await trackerDb.createAssignCamera(cameraName, roomId);
    if (resCamera === -1 || resCamera === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "Could not insert camera data, or the database is offline",
          redirectPage: "/onboarding",
        },
      });
      return;
    }
    res.status(200).send({
      status: "success",
      data: {
        ...resCamera,
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

adminRoutes.get("/get/cameras", async (req, res) => {
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
    const primaryId = parseInt(userId);
    const resDb = await userDb.getUserInfoByUserId(primaryId);
    if (resDb === -1 || resDb === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "Could not get data, or the database is offline",
          redirectPage: "/onboarding",
        },
      });
      return;
    }
    if (resDb.userType !== "admin") {
      res.status(400).send({
        status: "fail",
        data: {
          message: "You are not admin. Contact your admin to create room.",
        },
      });
      return;
    }
    const trackerDb = new TrackerDBv1();
    const resCameras = await trackerDb.getAssignedCameras();
    if (resCameras === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "Could not insert room data, or the database is offline",
          redirectPage: "/onboarding",
        },
      });
      return;
    }
    res.status(200).send({
      status: "success",
      data: {
        cameras: resCameras,
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

adminRoutes.get("/get/model", async (req, res) => {
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
    const primaryId = parseInt(userId);
    const resDb = await userDb.getUserInfoByUserId(primaryId);
    if (resDb === -1 || resDb === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "Could not get data, or the database is offline",
          redirectPage: "/onboarding",
        },
      });
      return;
    }
    if (resDb.userType !== "admin") {
      res.status(400).send({
        status: "fail",
        data: {
          message: "You are not admin. Contact your admin to create room.",
        },
      });
      return;
    }
    const trackerDb = new ModelDBv1();
    const resModel = await trackerDb.getModels();
    if (resModel === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "The database is offline",
          redirectPage: "/onboarding",
        },
      });
      return;
    }
    for (const model of resModel) {
      const modelEmp = await trackerDb.getAssignModelEmployee(model.modelId);
      if (modelEmp === null) {
        res.status(400).send({
          status: "fail",
          data: {
            message: "The database is offline",
          },
        });
        return;
      }
      model.modelEmployees = modelEmp;
    }
    res.status(200).send({
      status: "success",
      data: {
        models: resModel,
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

adminRoutes.get("/get/employees", async (req, res) => {
  try {
    const { userId }: Cookies = req.signedCookies;
    // console.log(req.signedCookies);
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
    const primaryId = parseInt(userId);
    const resDb = await userDb.getUserInfoByUserId(primaryId);
    if (resDb === -1 || resDb === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "Could not get data, or the database is offline",
          redirectPage: "/onboarding",
        },
      });
      return;
    }
    if (resDb.userType !== "admin") {
      res.status(400).send({
        status: "fail",
        data: {
          message: "You are not admin. Contact your admin to create room.",
        },
      });
      return;
    }
    const resEmployee = await userDb.getEmployees();
    if (resEmployee === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "The database is offline",
        },
      });
      return;
    }
    res.status(200).send({
      status: "success",
      data: {
        employees: resEmployee,
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

adminRoutes.post("/add/employee/image", async (req, res) => {
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
    const primaryId = parseInt(userId);
    const { employeeId, imgPath }: { employeeId: number; imgPath: string } =
      req.body;
    const resDb = await userDb.getUserInfoByUserId(primaryId);
    if (resDb === -1 || resDb === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "Could not get data, or the database is offline",
          redirectPage: "/onboarding",
        },
      });
      return;
    }
    if (resDb.userType !== "admin") {
      res.status(400).send({
        status: "fail",
        data: {
          message: "You are not admin. Contact your admin to create room.",
        },
      });
      return;
    }
    const modelDb = new ModelDBv1();
    const resModelEmployeeImg = await modelDb.addModelEmployeeImgPath(
      employeeId,
      imgPath
    );
    if (resModelEmployeeImg === -1 || resModelEmployeeImg === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message:
            "Could not insert model employee data, or the database is offline",
          redirectPage: "/onboarding",
        },
      });
      return;
    }
    res.status(200).send({
      status: "success",
      data: {
        ...resModelEmployeeImg,
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

adminRoutes.get("/employee/image/:empid", async (req, res) => {
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
    const primaryId = parseInt(userId);
    const resDb = await userDb.getUserInfoByUserId(primaryId);
    if (resDb === -1 || resDb === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "Could not get data, or the database is offline",
          redirectPage: "/onboarding",
        },
      });
      return;
    }
    if (resDb.userType !== "admin") {
      res.status(400).send({
        status: "fail",
        data: {
          message: "You are not admin. Contact your admin to create room.",
        },
      });
      return;
    }
    const empId = parseInt(req.params.empid);
    const modelDb = new ModelDBv1();
    const resModelEmployee = await modelDb.getAssignModelEmployeeImg(empId);
    if (resModelEmployee === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "The database is offline",
        },
      });
      return;
    }
    res.status(200).send({
      status: "success",
      data: {
        modelEmployee: resModelEmployee,
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

adminRoutes.post("/assing/model/room", async (req, res) => {
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
    const primaryId = parseInt(userId);
    const { modelId, roomId }: { modelId: number; roomId: number } = req.body;
    const resDb = await userDb.getUserInfoByUserId(primaryId);
    if (resDb === -1 || resDb === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "Could not get data, or the database is offline",
          redirectPage: "/onboarding",
        },
      });
      return;
    }
    if (resDb.userType !== "admin") {
      res.status(400).send({
        status: "fail",
        data: {
          message: "You are not admin. Contact your admin to create room.",
        },
      });
      return;
    }
    const modelDb = new ModelDBv1();
    const resModelEmployee = await modelDb.assignModelRoom(modelId, roomId);
    if (resModelEmployee === -1 || resModelEmployee === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message:
            "Could not insert model room data, or the database is offline",
          redirectPage: "/onboarding",
        },
      });
      return;
    }
    res.status(200).send({
      status: "success",
      data: {
        ...resModelEmployee,
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

v1Routes.use("/admin", adminRoutes);
userRouter.use("/v1", v1Routes);

export { userRouter };
