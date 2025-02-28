import chalk from "chalk";
import express from "express";
import { ClerkCache } from "../cache/redis";
import fileUpload, { UploadedFile } from "express-fileupload";
import {
  MiscDB,
  ModelDBv1,
  SessionDB,
  StatisticsDBv1,
  TrackerDBv1,
  UserDBv1,
} from "../db/db";
import { pythonConfigs, serverConfigs } from "../configs/configs";
import { v4 } from "uuid";
import { Cookies, SessionId } from "../types/auth";
import fs from "fs";
import {
  adminProfileSchema,
  ClerkInfo,
  employeeProfileSchema,
} from "../types/user";
import { cameraSchema, modelSchema, roomSchema } from "../types/model";
import path from "path";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { CameraJob } from "../types/db";
import { JsonOutputJob, ModelFeed } from "../types/python";
import { getDummyJsonOutput, stopJob } from "../helpers/jobs";
import { randInt } from "../helpers/random";
const userRouter = express.Router();
const v1Routes = express.Router();
const adminRoutes = express.Router();
const trackRouter = express.Router();
const statisticsRouter = express.Router();

// Macros
const { SESSION_EXPIRE_TIME_IN_DAYS } = serverConfigs;
const { INTERVAL_SEC } = pythonConfigs;

v1Routes.post("/login/employee", async (req, res) => {
  try {
    const { userName, password }: { userName: string; password: string } =
      req.body;
    const userDb = new UserDBv1();
    const verify = await userDb.verifyEmployeeUser(userName, password);
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
    console.log(chalk.red(`Error: ${error?.message}.`));
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
    console.log(chalk.red(`Error: ${error?.message}.`));
    res.status(400).send({
      status: "fail",
      error: error,
      data: {
        message: "Internal Server Error!",
      },
    });
  }
});

v1Routes.post(
  "/create/employee",
  fileUpload({
    limits: { fileSize: 500 * 1024 * 1024, fieldSize: 10 * 1024 * 1024 },
  }),
  async (req, res) => {
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
      if (!req.files || Object.keys(req.files).length === 0) {
        res.status(400).send({ status: "fail", error: "No file found" });
        return;
      }
      const allFile = req.files.files;
      const userData = req.files.userData as UploadedFile;
      const userJson = JSON.parse(userData.data.toString());
      // console.log(allFile, userJson, req.files);
      const employeeData = employeeProfileSchema.parse(userJson);
      const resDb = await userDb.createEmployeeUser(employeeData, imgURL);
      if (resDb === -1 || resDb === null) {
        res.status(400).send({
          status: "fail",
          data: {
            message:
              "Could not insert employee data, or the database is offline",
          },
        });
        return;
      }
      const modelDb = new ModelDBv1();
      let changeDp = true;
      if (Array.isArray(allFile)) {
        for (const file of allFile) {
          const fileName = v4().slice(0, 6);
          const fileSpilt = file.name.split(".");
          const fileExt = fileSpilt[fileSpilt.length - 1];
          const pathString = path.join(
            process.cwd(),
            `./public/images/${fileName}.${fileExt}`
          );
          await file.mv(pathString);
          const resImg = await modelDb.addEmployeeImgPath(
            resDb.primaryId,
            `./images/${fileName}.${fileExt}`,
            `/file/v1/image/${fileName}.${fileExt}`
          );
          if (resImg === -1 || resImg === null) {
            res.status(400).send({
              status: "fail",
              data: {
                message:
                  "Could not insert employee data, or the database is offline",
              },
            });
            return;
          }
          if (changeDp) {
            const resChange = await userDb.updateEmployeeImgUrl(
              resDb.primaryId,
              `/file/v1/image/${fileName}.${fileExt}`
            );
            if (resChange === -1 || resChange === null) {
              res.status(400).send({
                status: "fail",
                data: {
                  message:
                    "Could not insert employee data, or the database is offline",
                },
              });
              return;
            }
            changeDp = false;
          }
        }
      } else {
        const file = allFile;
        const fileName = v4().slice(0, 6);
        const fileSpilt = file.name.split(".");
        const fileExt = fileSpilt[fileSpilt.length - 1];
        const pathString = path.join(
          process.cwd(),
          `./public/images/${fileName}.${fileExt}`
        );
        await file.mv(pathString);
        const resImg = await modelDb.addEmployeeImgPath(
          resDb.primaryId,
          `./images/${fileName}.${fileExt}`,
          `/file/v1/image/${fileName}.${fileExt}`
        );
        if (resImg === -1 || resImg === null) {
          res.status(400).send({
            status: "fail",
            data: {
              message:
                "Could not insert employee data, or the database is offline",
            },
          });
          return;
        }
        if (changeDp) {
          const resChange = await userDb.updateEmployeeImgUrl(
            resDb.primaryId,
            `/file/v1/image/${fileName}.${fileExt}`
          );
          if (resChange === -1 || resChange === null) {
            res.status(400).send({
              status: "fail",
              data: {
                message:
                  "Could not insert employee data, or the database is offline",
              },
            });
            return;
          }
          changeDp = false;
        }
      }
      res.status(200).send({
        status: "success",
        data: {
          ...resDb,
        },
      });
    } catch (error: any) {
      console.log(chalk.red(`Error: ${error?.message}.`));
      res.status(400).send({
        status: "fail",
        error: error,
        data: {
          message: "Internal Server Error!",
        },
      });
    }
  }
);

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
    console.log(chalk.red(`Error: ${error?.message}.`));
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
    const resRoom = await trackerDb.createRoom(room, primaryId);
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
    console.log(chalk.red(`Error: ${error?.message}.`));
    res.status(400).send({
      status: "fail",
      error: error,
      data: {
        message: "Internal Server Error!",
      },
    });
  }
});

adminRoutes.get("/get/rooms", async (req, res) => {
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
    console.log(chalk.red(`Error: ${error?.message}.`));
    res.status(400).send({
      status: "fail",
      error: error,
      data: {
        message: "Internal Server Error!",
      },
    });
  }
});

adminRoutes.post("/create/camera", async (req, res) => {
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
    const camera = cameraSchema.parse(req.body);
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
    const resCamera = await trackerDb.createCamera(
      camera.cameraName,
      camera.ip,
      camera.videoLink,
      camera.port
    );
    if (resCamera === -1 || resCamera === null) {
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
        ...resCamera,
      },
    });
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error?.message}.`));
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
    const resCameras = await trackerDb.getNullCameras();
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
    console.log(chalk.red(`Error: ${error?.message}.`));
    res.status(400).send({
      status: "fail",
      error: error,
      data: {
        message: "Internal Server Error!",
      },
    });
  }
});

adminRoutes.post("/create/model", async (req, res) => {
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
    const model = modelSchema.parse(req.body);
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
    const resModel = await modelDb.createModel(
      model.modelName,
      model.modelDesc
    );
    if (resModel === -1 || resModel === null) {
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
        ...resModel,
      },
    });
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error?.message}.`));
    res.status(400).send({
      status: "fail",
      error: error,
      data: {
        message: "Internal Server Error!",
      },
    });
  }
});

adminRoutes.get("/get/models", async (req, res) => {
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
    res.status(200).send({
      status: "success",
      data: {
        models: resModel,
      },
    });
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error?.message}.`));
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
    const modelDb = new ModelDBv1();
    for (const emp of resEmployee) {
      const resImg = await modelDb.getEmployeeImgPath(emp.id);
      if (resImg === null) {
        res.status(400).send({
          status: "fail",
          data: {
            message: "The database is offline",
          },
        });
        return;
      }
      emp.images = resImg;
    }
    res.status(200).send({
      status: "success",
      data: {
        employees: resEmployee,
      },
    });
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error?.message}.`));
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
    console.log(chalk.red(`Error: ${error?.message}.`));
    res.status(400).send({
      status: "fail",
      error: error,
      data: {
        message: "Internal Server Error!",
      },
    });
  }
});

trackRouter.get("/live/:port", async (req, res) => {
  try {
    const response = await fetch(
      `http://localhost:${req.params.port}/video_feed`
    );
    const reader = response.body?.getReader();
    if (!reader) {
      res.status(500).send("Error: Response body is not readable");
      return;
    }
    res.setHeader(
      "Content-Type",
      response.headers.get("Content-Type") || "video/mjpeg"
    );
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        res.end();
        return;
      }
      res.write(value);
    }
  } catch (error: any) {
    console.log(error);
    res.status(500).send("Failed to fetch video stream");
  }
});

// Jobs
const jobProcesses: ChildProcessWithoutNullStreams[] = [];
const roomCamera: {
  [roomId: string]: {
    [cameraId: string]: JsonOutputJob;
  };
} = {};

let jobInterval: ReturnType<typeof setInterval>;
let mainJobModelData: ModelFeed = {};
let mainRoomData: {
  [roomId: string]: {
    roomName: string;
    roomId: string;
    maxCap: number;
  };
} = {};
let mainCameraData: {
  [cameraId: string]: CameraJob;
} = {};

let lastVisited: { [roomId: string]: number[] } = {};

trackRouter.post("/start", async (req, res) => {
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
    console.log(chalk.yellow("Job starting!"));
    const modelDb = new ModelDBv1();
    const statsDb = new StatisticsDBv1();
    const resCam = await modelDb.getCamerasForJob();
    // console.log(resCam);
    if (resCam === -1 || resCam === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "Could not get data, or the database is offline",
        },
      });
      return;
    }
    if (resCam === -2) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "Need min one room to be crated and have a camera in that.",
        },
      });
      return;
    }
    const jobs: CameraJob[] = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), `/metadata/jobs.json`), {
        encoding: "utf8",
      })
    );
    if (Object.keys(jobs).length !== 0) {
      res.status(200).send({
        status: "success",
        data: {
          cameras: resCam,
        },
      });
      return;
    }
    for (const camera of resCam) {
      if (camera.port <= 0) {
        continue;
      }
      const tdyDate = new Date().toLocaleDateString("en-CA");
      const jobModelData: ModelFeed = {};
      for (const emp of camera.emps) {
        jobModelData[emp.id.toString()] = {
          empName: `${emp.firstName} ${emp.lastName}`,
          empUserName: emp.userName,
          empId: emp.id.toString(),
          images: emp.images.map((ele) => ele.imgPath || "need img path"),
        };
        const resInsert = await modelDb.insertUserDataIfNotExists(
          emp.id,
          camera.roomId || -1,
          tdyDate
        );
        if (resInsert === -1 || resInsert === null) {
          res.status(400).send({
            status: "fail",
            data: {
              message: "Could not create a job.",
            },
          });
          return;
        }
      }
      mainJobModelData = { ...mainJobModelData, ...jobModelData };
      mainRoomData = {
        ...mainRoomData,
        [camera.roomId?.toString() || ""]: {
          roomId: camera.roomId?.toString() || "",
          roomName: camera.roomName,
          maxCap: camera.maxHeadCount,
        },
      };
      mainCameraData[camera.cameraId] = camera;
      fs.writeFileSync(
        path.join(
          process.cwd(),
          `/model_data/${camera.roomId}-${camera.cameraId}.json`
        ),
        JSON.stringify(jobModelData, null, 2),
        { encoding: "utf8" }
      );
      const commandList = ["docker", "run"];
      commandList.push(
        "-p",
        `${camera.port}:5222`,
        "--name",
        `camera_${camera.cameraId}`
      );
      commandList.push(
        "-v",
        `${path.join(process.cwd(), "/public/images")}:/app/images`
      );
      commandList.push(
        "-v",
        `${path.join(process.cwd(), "/model_data")}:/app/model_data`
      );
      commandList.push(
        "--rm",
        "-e",
        "PYTHONUNBUFFERED=1",
        "model-py",
        "python",
        "main_video2.py"
      );
      commandList.push(
        `/app/model_data/${camera.roomId}-${camera.cameraId}.json`,
        `${camera.videoLink}`,
        `${camera.roomId}`,
        `${camera.cameraId}`,
        `${INTERVAL_SEC}`
      );
      // console.log(commandList[0], commandList.slice(1));
      console.log(
        chalk.yellowBright(
          `Running docker container for camera: ${camera.cameraName}, cameraId: ${camera.cameraId}...`
        )
      );
      const modelJob = spawn(commandList[0], commandList.slice(1));
      modelJob.stdout.on("data", async (data) => {
        const data1 = data.toString() as string;
        try {
          const jsonData: JsonOutputJob = JSON.parse(data1);
          const cameras = roomCamera[jsonData.roomId];
          cameras[jsonData.cameraId] = jsonData;
        } catch (error) {}
      });
      jobProcesses.push(modelJob);
      const roomId = camera.roomId?.toString() || "";
      if (roomId in roomCamera) {
        const cameras = roomCamera[roomId];
        cameras[camera.cameraId.toString()] = getDummyJsonOutput();
      } else {
        roomCamera[roomId] = {
          [camera.cameraId.toString()]: getDummyJsonOutput(),
        };
      }
    }
    if (jobInterval) {
      clearInterval(jobInterval);
    }
    jobInterval = setInterval(async () => {
      try {
        // console.log(roomCamera);
        for (const roomId in roomCamera) {
          const room = roomCamera[roomId];
          const empIdsSet = new Set<number>();
          for (const cameraId in room) {
            const jsonData = room[cameraId];
            if (jsonData.faceDetected === true) {
              for (const empId of jsonData.empIds) {
                if (empId !== "Unknown" && !Number.isNaN(parseInt(empId))) {
                  empIdsSet.add(parseInt(empId));
                } else {
                  statsDb.addNoti(
                    parseInt(userId),
                    `Unknow person has entered the room ${mainRoomData[roomId].roomName} of roomId ${roomId},
                  detected from camera ${mainCameraData[cameraId].cameraName} of cameraId ${cameraId}`.replace(
                      /\s+/g,
                      " "
                    ),
                    "alert"
                  );
                }
              }
            }
          }
          const empIds = [...empIdsSet];
          if (empIds.length > mainRoomData[roomId].maxCap) {
            statsDb.addNoti(
              parseInt(userId),
              `Maximum capacity exceeded for room ${mainRoomData[roomId].roomName} of roomId ${roomId}`.replace(
                /\s+/g,
                " "
              ),
              "warning"
            );
          } else if (empIds.length / mainRoomData[roomId].maxCap >= 0.5) {
            statsDb.addNoti(
              parseInt(userId),
              `Room occupancy at ${parseFloat(
                ((empIds.length / mainRoomData[roomId].maxCap) * 100).toFixed(2)
              )}% for room ${
                mainRoomData[roomId].roomName
              } of roomId ${roomId}`.replace(/\s+/g, " "),
              "info"
            );
          }
          if (roomId in lastVisited) {
            const pastEmpIds = lastVisited[roomId];
            for (const empId of empIds) {
              if (pastEmpIds.includes(empId) === false) {
                statsDb.addNoti(
                  parseInt(userId),
                  `${
                    mainJobModelData[empId.toString()].empName
                  } has entered the room ${
                    mainRoomData[roomId].roomName
                  } of roomId ${roomId}`.replace(/\s+/g, " "),
                  "info"
                );
              }
            }
            for (const empId of pastEmpIds) {
              if (empIds.includes(empId) === false) {
                statsDb.addNoti(
                  parseInt(userId),
                  `${
                    mainJobModelData[empId.toString()].empName
                  } has leaved the room ${
                    mainRoomData[roomId].roomName
                  } of roomId ${roomId}`.replace(/\s+/g, " "),
                  "info"
                );
              }
            }
          }
          lastVisited[roomId] = empIds;
          const tdyDate = new Date().toLocaleDateString("en-CA");
          if (empIds.length === 0) {
            continue;
          }
          const resUpdate = await modelDb.updateUserData(
            empIds,
            Number.isNaN(parseInt(roomId)) ? -1 : parseInt(roomId),
            tdyDate,
            INTERVAL_SEC
          );
          if (resUpdate === -1 || resUpdate === null) {
            console.log(
              chalk.red(`Failed to update for users with id:`),
              empIds,
              "room details:",
              room
            );
          } else {
            console.log(
              chalk.yellow(
                `Update done on room id: ${roomId} for users with id: `
              ),
              empIds
            );
          }
        }
      } catch (error: any) {
        console.log(chalk.red(`Error: ${error?.message}.`));
      }
    }, INTERVAL_SEC * 1000);
    fs.writeFileSync(
      path.join(process.cwd(), `/metadata/jobs.json`),
      JSON.stringify(resCam, null, 2),
      { encoding: "utf8" }
    );
    console.log(chalk.yellow("Job started!"));
    res.status(200).send({
      status: "success",
      data: {
        cameras: resCam,
      },
    });
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error?.message}.`));
    res.status(400).send({
      status: "fail",
      error: error,
      data: {
        message: "Internal Server Error!",
      },
    });
  }
});

trackRouter.get("/get", async (req, res) => {
  try {
    const jobs: CameraJob[] = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), `/metadata/jobs.json`), {
        encoding: "utf8",
      })
    );
    res.status(200).send({
      status: "success",
      data: {
        cameras: jobs,
      },
    });
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error?.message}.`));
    res.status(400).send({
      status: "fail",
      error: error,
      data: {
        message: "Internal Server Error!",
      },
    });
  }
});

trackRouter.post("/stop", async (req, res) => {
  try {
    const jobCleaned = stopJob();
    if (jobCleaned === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "Could not clear the jobs.",
        },
      });
      return;
    }
    for (const jobProcess of jobProcesses) {
      jobProcess.kill();
      console.log(chalk.yellow(`Clearing child process: ${jobProcess.pid}`));
    }
    if (jobInterval) {
      clearInterval(jobInterval);
      console.log(
        chalk.yellow(`Clearing job interval function: ${jobInterval}`)
      );
    }
    res.status(200).send({
      status: "success",
      data: {
        jobCleaned: jobCleaned,
      },
    });
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error?.message}`));
    res.status(400).send({
      status: "fail",
      error: error,
      data: {
        message: "Internal Server Error!",
      },
    });
  }
});

trackRouter.get("/noti", async (req, res) => {
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
    const statsDb = new StatisticsDBv1();
    const roomData = [];
    for (const roomId in roomCamera) {
      const room = roomCamera[roomId];
      const empIdsSet = new Set<number>();
      for (const cameraId in room) {
        const jsonData = room[cameraId];
        if (jsonData.faceDetected === true) {
          for (const empId of jsonData.empIds) {
            empIdsSet.add(
              Number.isNaN(parseInt(empId))
                ? randInt(10000, 50000)
                : parseInt(empId)
            );
          }
        }
      }
      const empIds = [...empIdsSet];
      roomData.push({
        id: parseInt(roomId),
        name: mainRoomData[roomId].roomName,
        maxCapacity: mainRoomData[roomId].maxCap,
        currentOccupancy: empIds.length,
        status:
          empIds.length > mainRoomData[roomId].maxCap ? "exceeded" : "normal",
      });
    }
    const noti = await statsDb.getNoti();
    res.status(200).send({
      status: "success",
      data: {
        room: roomData,
        noti,
      },
    });
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error?.message}`));
    res.status(400).send({
      status: "fail",
      error: error,
      data: {
        message: "Internal Server Error!",
      },
    });
  }
});

statisticsRouter.post("/dummy/data", async (req, res) => {
  try {
    const misc = new MiscDB();
    const dummy = await misc.addDummyEmployeeData();
    if (dummy === -1 || dummy === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "Could not insert data, or the database is offline",
          resDb: dummy,
        },
      });
      return;
    }
    res.status(200).send({
      status: "success",
      data: {
        resDb: dummy,
      },
    });
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error?.message}`));
    res.status(400).send({
      status: "fail",
      error: error,
      data: {
        message: "Internal Server Error!",
      },
    });
  }
});

statisticsRouter.get("/dashboard", async (req, res) => {
  try {
    const statisticsDb = new StatisticsDBv1();
    const resDb = await statisticsDb.getDashboard();
    if (resDb === -1 || resDb === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "Could not insert data, or the database is offline",
          resDb: resDb,
        },
      });
      return;
    }
    res.status(200).send({
      status: "success",
      data: resDb,
    });
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error?.message}`));
    res.status(400).send({
      status: "fail",
      error: error,
      data: {
        message: "Internal Server Error!",
      },
    });
  }
});

statisticsRouter.get("/dashboard/employee", async (req, res) => {
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
    const statisticsDb = new StatisticsDBv1();
    const resDb = await statisticsDb.getDashboardByUserId(parseInt(userId));
    if (resDb === -1 || resDb === null) {
      res.status(400).send({
        status: "fail",
        data: {
          message: "Could not insert data, or the database is offline",
          resDb: resDb,
        },
      });
      return;
    }
    res.status(200).send({
      status: "success",
      data: resDb,
    });
  } catch (error: any) {
    console.log(chalk.red(`Error: ${error?.message}`));
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
v1Routes.use("/track", trackRouter);
v1Routes.use("/statistics", statisticsRouter);
userRouter.use("/v1", v1Routes);

export { userRouter };
