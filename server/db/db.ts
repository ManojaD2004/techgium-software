import chalk from "chalk";
import { Pool, PoolClient } from "pg";
import { v4 } from "uuid";
import {
  Camera,
  CameraJob,
  Model,
  ModelEmployeeImg,
  Ping,
  Room,
} from "../types/db";
import { getRandomInteger } from "../helpers/randomNumber";
import { dbConfigs, pythonConfigs } from "../configs/configs";
import { waitForNSeconds } from "../helpers/wait";
import { randNum } from "../helpers/random";
import {
  AdminProfile,
  EmployeeProfile,
  GetEmployeeProfile,
  GetEmployeeProfileWithoutImg,
} from "../types/user";
import { RoomData } from "../types/model";
import format from "pg-format";
import { getCompanyMetadata } from "../helpers/company";

// Macros
const {
  DB_LIMIT_ROWS,
  DB_RETRY_QUERY,
  DB_RETRY_WAIT_MAX_SEC,
  DB_RETRY_WAIT_MIN_SEC,
} = dbConfigs;

const { INTERVAL_SEC } = pythonConfigs;

class DB {
  private static client: Pool;
  constructor(connectionString: string);
  constructor();
  constructor(connectionString?: string) {
    if (DB.client) {
      return;
    }
    if (!connectionString) {
      console.log(chalk.red(`Initially need Connection String to connect!`));
      return;
    }
    DB.client = new Pool({
      connectionString: connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    DB.client.on("connect", (pClient) => {
      pClient.on("error", (err: any) => {
        console.log(chalk.red("PostgresSQL Error: "), err?.message);
      });
    });
    DB.client.on("error", (err: any) => {
      console.log(chalk.red("PostgresSQL Error: "), err?.message);
    });
  }
  async end() {
    await DB.client.end();
  }
  async ping() {
    return await this.retryQuery("ping", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(`
          SELECT 'Hello from PostgresSQL' as pong;`);
        if (res.rowCount !== 1) {
          return -1;
        }
        const ping: Ping = res.rows[0];
        return ping;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  totalClientCounts() {
    console.log(chalk.cyan("Idle clients: ", DB.client.idleCount));
    console.log(chalk.cyan("Total clients: ", DB.client.totalCount));
  }
  protected async connect() {
    const pClient = await DB.client.connect();
    return pClient;
  }
  protected release(pClient: PoolClient) {
    pClient.release();
  }
  protected releaseWithDestroy(pClient: PoolClient) {
    pClient.release(true);
  }
  protected getDBInstance() {
    return DB.client;
  }
  protected async retryQuery<T>(
    queryName: string,
    queryFunction: () => T,
    retryTimes: number = DB_RETRY_QUERY
  ) {
    try {
      for (let i = 0; i < retryTimes; i++) {
        const queryRes = await queryFunction();
        if (queryRes !== null && queryRes !== undefined) {
          return queryRes;
        }
        await waitForNSeconds(
          randNum(DB_RETRY_WAIT_MIN_SEC, DB_RETRY_WAIT_MAX_SEC)
        );
      }
      console.log(
        chalk.red(
          `Failed query ${queryName} for retries of ${retryTimes} times`
        )
      );
      return null;
    } catch (error: any) {
      console.log(
        chalk.red("PostgresSQL Error: "),
        error?.message,
        error?.code
      );
      return null;
    }
  }
}
class UserDBv1 extends DB {
  // Get User Info
  async getUserInfoByUserId(userId: number) {
    return await this.retryQuery("getUserInfoByUserId", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
          SELECT "type", "user_name" FROM "users" WHERE
          "id" = $1::int;`,
          [userId]
        );
        if (res.rowCount !== 1) {
          return -1;
        }
        const userData = {
          userType: res.rows[0].type as string,
          userName: res.rows[0]["user_name"] as string,
        };
        return userData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  // Employee User
  async createEmployeeUser(profileData: EmployeeProfile, imgURL: string) {
    return await this.retryQuery("createEmployeeUser", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const shortuuid = v4().slice(0, 6);
        const userName =
          profileData.firstName.toLowerCase().replace(/\s/g, "-") +
          "-" +
          profileData.lastName.toLowerCase().replace(/\s/g, "-") +
          "-" +
          shortuuid;
        await pClient.query("BEGIN");
        const res = await pClient.query(
          `
          INSERT INTO "users" ("user_name", "first_name",
          "last_name", "img_URL", "type", "phone_no", "password") 
          VALUES ($1::varchar,
          $2::varchar, $3::varchar, $4::varchar, $5::user_type,
          $6::varchar, $7::varchar) RETURNING id;`,
          [
            userName,
            profileData.firstName,
            profileData.lastName,
            imgURL,
            "employee",
            profileData.phoneNumber,
            profileData.password,
          ]
        );
        if (res.rowCount !== 1) {
          await pClient.query("ROLLBACK");
          return -1;
        }
        const primaryId: number = res.rows[0].id;
        await pClient.query("COMMIT");
        const userData = {
          primaryId,
        };
        return userData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        if (pClient) {
          await pClient.query("ROLLBACK");
        }
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async updateEmployeeImgUrl(empId: number, imgURL: string) {
    return await this.retryQuery("createEmployeeUser", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        await pClient.query("BEGIN");
        const res = await pClient.query(
          `
          UPDATE "users"
          SET "img_URL" = $1::varchar
          WHERE "id" = $2::int RETURNING "id";`,
          [imgURL, empId]
        );
        if (res.rowCount !== 1) {
          await pClient.query("ROLLBACK");
          return -1;
        }
        const primaryId: number = res.rows[0].id;
        await pClient.query("COMMIT");
        const userData = {
          empId: primaryId,
        };
        return userData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        if (pClient) {
          await pClient.query("ROLLBACK");
        }
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async getEmployees() {
    return await this.retryQuery("getEmployees", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
          SELECT u."id",
          u."user_name" as "userName",
          u."first_name" as "firstName",
          u."last_name" as "lastName",
          u."img_URL" as "imgURL",
          u."phone_no" as "phoneNumber"
          FROM "users" as u WHERE
          u."type" = 'employee';`
        );
        const userData: GetEmployeeProfile[] = res.rows;
        return userData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  // Admin User
  async createAdminUser(profileData: AdminProfile, imgURL: string) {
    return await this.retryQuery("createAdminUser", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        await pClient.query("BEGIN");
        const res = await pClient.query(
          `
          INSERT INTO "users" ("user_name", "first_name",
          "last_name", "img_URL", "type", "phone_no", "password") 
          VALUES ($1::varchar, $2::varchar,
          $3::varchar, $4::varchar, $5::user_type,
          $6::varchar, $7::varchar) RETURNING id;`,
          [
            profileData.userName,
            profileData.firstName,
            profileData.lastName,
            imgURL,
            "admin",
            profileData.phoneNumber,
            profileData.password,
          ]
        );
        if (res.rowCount !== 1) {
          await pClient.query("ROLLBACK");
          return -1;
        }
        const primaryId: number = res.rows[0].id;
        await pClient.query("COMMIT");
        const userData = {
          primaryId,
        };
        return userData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        if (pClient) {
          await pClient.query("ROLLBACK");
        }
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async verifyAdminUser(userName: string, password: string) {
    return await this.retryQuery("verifyAdminUser", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
          SELECT "id" FROM "users" WHERE
          "user_name" = $1::varchar AND "password" = $2::varchar AND "type" = 'admin';`,
          [userName, password]
        );
        if (res.rowCount !== 1) {
          return -1;
        }
        const userData = {
          primaryId: res.rows[0].id as number,
        };
        return userData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async verifyEmployeeUser(userName: string, password: string) {
    return await this.retryQuery("verifyEmployeeUser", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
          SELECT "id" FROM "users" WHERE
          "user_name" = $1::varchar AND "password" = $2::varchar AND "type" = 'employee';`,
          [userName, password]
        );
        if (res.rowCount !== 1) {
          return -1;
        }
        const userData = {
          primaryId: res.rows[0].id as number,
        };
        return userData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
}

class TrackerDBv1 extends DB {
  // Room and Camera operations
  async createRoom(room: RoomData, userId: number) {
    return await this.retryQuery("createRoom", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        await pClient.query("BEGIN");
        const res = await pClient.query(
          `
         INSERT INTO "rooms" ("room_name", "created_by",
         "max_head_count","model_id") 
         VALUES ($1::varchar, $2::int, $3::int,$4::int) 
         RETURNING id;`,
          [room.roomName, userId, room.maxHeadCount || 1, room.modelId]
        );
        if (res.rowCount !== 1) {
          await pClient.query("ROLLBACK");
          return -1;
        }
        const roomId = res.rows[0].id as number;
        const empWithRoomId = room.employees.map((ele) => {
          return [roomId, ele];
        });
        const resEmps = await pClient.query(
          format(
            `
          INSERT INTO "room_employee"
          ("room_id", "employee_id")
          VALUES %L RETURNING id`,
            empWithRoomId
          )
        );
        if (resEmps.rowCount === 0) {
          await pClient.query("ROLLBACK");
          return -1;
        }
        for (const cameraId of room.cameras) {
          const resCamera = await pClient.query(
            `
            UPDATE "cameras"
            SET "room_id" = $1::int
            WHERE "id" = $2::int
            RETURNING id;
            `,
            [roomId, cameraId]
          );
          if (resCamera.rowCount !== 1) {
            await pClient.query("ROLLBACK");
            return -1;
          }
        }
        const roomData = {
          roomId,
        };
        await pClient.query("COMMIT");
        return roomData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        if (pClient) {
          await pClient.query("ROLLBACK");
        }
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async createAssignCamera(cameraName: string, roomId: number) {
    return await this.retryQuery("createAssignCamera", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        await pClient.query("BEGIN");
        const res = await pClient.query(
          `
         INSERT INTO "rooms" ("camera_name", "room_id") 
         VALUES ($1::varchar, $2::int) RETURNING id;`,
          [cameraName, roomId]
        );
        if (res.rowCount !== 1) {
          await pClient.query("ROLLBACK");
          return -1;
        }
        const cameraData = {
          cameraId: res.rows[0].id as number,
        };
        await pClient.query("COMMIT");
        return cameraData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        if (pClient) {
          await pClient?.query("ROLLBACK");
        }
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async getRooms() {
    return await this.retryQuery("getRooms", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
          SELECT 
            r."room_name" as "roomName",
            r."id" as "roomId",
            r."created_at" as "createdAt",
            r."max_head_count" as "maxHeadCount",
            a."user_name" as "userName", 
            a."first_name" as "firstName",
            a."last_name" as "lastName",
            a."img_URL" as "imgURL",
            a."phone_no" as "phoneNo",
            r."model_id" as "modelId",
            m."model_name" as "modelName"
          FROM 
            "rooms" as r
          INNER JOIN 
            "users" as a ON
          r."created_by" = a."id" AND
          a."type" = 'admin'
          INNER JOIN 
            "model" as m ON
          r."model_id" = m."id"`
        );
        const roomData: Room[] = res.rows;
        for (const room of roomData) {
          const roomId = room.roomId;
          const resEmp = await pClient.query(
            `
          SELECT u."id",
          u."user_name" as "userName",
          u."first_name" as "firstName",
          u."last_name" as "lastName",
          u."img_URL" as "imgURL",
          u."phone_no" as "phoneNumber"
          FROM "room_employee" as re
          INNER JOIN 
          "users" as u 
          ON re."employee_id" = u."id"
          AND u."type" = 'employee'
          WHERE
          re."room_id" = $1::int;`,
            [roomId]
          );
          if (resEmp.rowCount === 0) {
            return -1;
          }
          const empData: GetEmployeeProfileWithoutImg[] = resEmp.rows;
          room.employees = empData;
          const resCamera = await pClient.query(
            `
          SELECT 
            "id" as "cameraId",
            "ip",
            "video_link" as "videoLink",
            "tracker_port" as "port",
            "camera_name" as "cameraName",
            "room_id" as "roomId"
          FROM 
            "cameras"
          WHERE "room_id" = $1::int;`,
            [roomId]
          );
          if (resCamera.rowCount === 0) {
            return -1;
          }
          const cameraData: Camera[] = resCamera.rows;
          room.cameras = cameraData;
        }
        return roomData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async getNullCameras() {
    return await this.retryQuery("getNullCameras", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
          SELECT 
            "id" as "cameraId",
            "ip",
            "video_link" as "videoLink",
            "tracker_port" as "port",
            "camera_name" as "cameraName",
            "room_id" as "roomId"
          FROM 
            "cameras"
          WHERE "room_id" IS NULL;`
        );
        const cameraData: Camera[] = res.rows;
        return cameraData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async updateRoom(maxHeadCount: number, roomName: string, roomId: number) {
    return await this.retryQuery("updateRoom", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        await pClient.query("BEGIN");
        const res = await pClient.query(
          `
          UPDATE "rooms" as r
          SET
            r."max_head_count" = $1::int,
            r."room_name" = $2::varchar
         WHERE r."id" = $3::int RETURNING id;`,
          [maxHeadCount, roomName, roomId]
        );
        if (res.rowCount !== 1) {
          await pClient.query("ROLLBACK");
          return -1;
        }
        const roomData = {
          roomId: res.rows[0].id as number,
        };
        await pClient.query("COMMIT");
        return roomData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        if (pClient) {
          await pClient.query("ROLLBACK");
        }
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async createCamera(
    cameraName: string,
    ip: string,
    videoLink: string,
    trackerPort: number
  ) {
    return await this.retryQuery("createCamera", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        await pClient.query("BEGIN");
        const res = await pClient.query(
          `
         INSERT INTO "cameras" ("camera_name", "ip",
         "video_link", "tracker_port") 
         VALUES ($1::varchar, $2::varchar, $3::varchar, $4::int) RETURNING id;`,
          [cameraName, ip, videoLink, trackerPort]
        );
        if (res.rowCount !== 1) {
          await pClient.query("ROLLBACK");
          return -1;
        }
        const cameraData = {
          cameraId: res.rows[0].id as number,
        };
        await pClient.query("COMMIT");
        return cameraData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        if (pClient) {
          await pClient.query("ROLLBACK");
        }
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async updateAssignCamera(
    cameraName: number,
    roomId: number,
    cameraId: number
  ) {
    return await this.retryQuery("updateAssignCamera", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        await pClient.query("BEGIN");
        const res = await pClient.query(
          `
          UPDATE "cameras" as c
          SET
            c."camera_name" = $1::varchar,
            c."room_id" = $2::int
         WHERE c."id" = $3::int RETURNING id;`,
          [cameraName, roomId, cameraId]
        );
        if (res.rowCount !== 1) {
          await pClient.query("ROLLBACK");
          return -1;
        }
        const cameraData = {
          cameraId: res.rows[0].id as number,
        };
        await pClient.query("COMMIT");
        return cameraData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        if (pClient) {
          await pClient.query("ROLLBACK");
        }
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async deleteRoom(roomId: number) {
    return await this.retryQuery("deleteRoom", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        await pClient.query("BEGIN");
        const res = await pClient.query(
          `
          DELETE FROM "rooms" as r
          WHERE r."id" = $1::int RETURNING id;`,
          [roomId]
        );
        if (res.rowCount !== 1) {
          await pClient.query("ROLLBACK");
          return -1;
        }
        const roomData = {
          roomId: res.rows[0].id as number,
        };
        await pClient.query("COMMIT");
        return roomData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        if (pClient) {
          await pClient.query("ROLLBACK");
        }
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async deleteAssignCamera(cameraId: number) {
    return await this.retryQuery("deleteAssignCamera", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        await pClient.query("BEGIN");
        const res = await pClient.query(
          `
          DELETE FROM "cameras" as c
          WHERE c."id" = $1::int RETURNING id;`,
          [cameraId]
        );
        if (res.rowCount !== 1) {
          await pClient.query("ROLLBACK");
          return -1;
        }
        const cameraData = {
          cameraId: res.rows[0].id as number,
        };
        await pClient.query("COMMIT");
        return cameraData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        if (pClient) {
          await pClient.query("ROLLBACK");
        }
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
}

class ModelDBv1 extends DB {
  // Model and Employee Data operations
  async createModel(modelName: string, modelDesc: string) {
    return await this.retryQuery("createModel", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        await pClient.query("BEGIN");
        const res = await pClient.query(
          `
         INSERT INTO "model" ("model_name", "model_desc") 
         VALUES ($1::varchar, $2::text) RETURNING id;`,
          [modelName, modelDesc]
        );
        if (res.rowCount !== 1) {
          await pClient.query("ROLLBACK");
          return -1;
        }
        const modelData = {
          modelId: res.rows[0].id as number,
        };
        await pClient.query("COMMIT");
        return modelData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        if (pClient) {
          await pClient.query("ROLLBACK");
        }
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async updateModel(modelName: string, modelDesc: string, modelId: number) {
    return await this.retryQuery("updateModel", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        await pClient.query("BEGIN");
        const res = await pClient.query(
          `
         UPDATE "model" as m
          SET
            m."model_name" = $1::varchar,
            m."model_desc" = $2::text
         WHERE m."id" = $3::int RETURNING id;`,
          [modelName, modelDesc, modelId]
        );
        if (res.rowCount !== 1) {
          await pClient.query("ROLLBACK");
          return -1;
        }
        const modelData = {
          roomId: res.rows[0].id as number,
        };
        await pClient.query("COMMIT");
        return modelData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        if (pClient) {
          await pClient.query("ROLLBACK");
        }
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async getModels() {
    return await this.retryQuery("getModels", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
         SELECT 
          m."id" as "modelId",
          m."model_name" as "modelName",
          m."created_at" as "createdAt",
          m."model_desc" as "modelDesc"
         FROM "model" as m`
        );
        const modelData: Model[] = res.rows;
        return modelData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async deleteModel(modelId: number) {
    return await this.retryQuery("deleteModel", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        await pClient.query("BEGIN");
        const res = await pClient.query(
          `
          DELETE FROM "model" as m
          WHERE m."id" = $1::int RETURNING id;`,
          [modelId]
        );
        if (res.rowCount !== 1) {
          await pClient.query("ROLLBACK");
          return -1;
        }
        const modelData = {
          roomId: res.rows[0].id as number,
        };
        await pClient.query("COMMIT");
        return modelData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        if (pClient) {
          await pClient.query("ROLLBACK");
        }
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async addEmployeeImgPath(
    employeeId: number,
    imgPath: string,
    publicLink: string
  ) {
    return await this.retryQuery("addEmployeeImgPath", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        await pClient.query("BEGIN");
        const res = await pClient.query(
          `
         INSERT INTO "employee_img" ("employee_id", 
         "img_path", "public_link") 
         VALUES ($1::int, $2::varchar, $3::varchar) RETURNING id;`,
          [employeeId, imgPath, publicLink]
        );
        if (res.rowCount !== 1) {
          await pClient.query("ROLLBACK");
          return -1;
        }
        const resUpdate = await pClient.query(
          `
         UPDATE "users" SET
         "total_img_uploaded" = "total_img_uploaded" + 1
         WHERE "id" = $1::int RETURNING id;`,
          [employeeId]
        );
        if (resUpdate.rowCount !== 1) {
          await pClient.query("ROLLBACK");
          return -1;
        }
        const modelData = {
          modelEmployeeImgId: res.rows[0].id as number,
        };
        await pClient.query("COMMIT");
        return modelData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        if (pClient) {
          await pClient.query("ROLLBACK");
        }
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async getEmployeeImgPath(empId: number) {
    return await this.retryQuery("getEmployeeImgPath", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
         SELECT 
          mei."id",
          mei."created_at" as "createdAt",
          mei."public_link" as "publicLink"
         FROM "employee_img" as mei
         WHERE 
          mei."employee_id" = $1::int
         ORDER BY 
          mei."created_at";`,
          [empId]
        );
        const modelData: ModelEmployeeImg[] = res.rows;
        return modelData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async getRoomIdByDate(date: string) {
    return await this.retryQuery("getRoomIdByDate", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
         SELECT 
          "room_id" as "roomId", "id"
         FROM "employee_data"
         WHERE 
          "date" = $1::date;`,
          [date]
        );
        type RoomId = { id: number; roomId: number };
        const modelData: RoomId[] = res.rows;
        return modelData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async getCamerasForJob() {
    return await this.retryQuery("getCamerasForJob", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        await pClient.query("BEGIN");
        const res = await pClient.query(
          `
          SELECT 
            c."id" as "cameraId",
            c."ip",
            c."video_link" as "videoLink",
            c."tracker_port" as "port",
            c."camera_name" as "cameraName",
            c."room_id" as "roomId",
            r."room_name" as "roomName",
            r."max_head_count" as "maxHeadCount",
            r."model_id" as "modelId",
            m."model_name" as "modelName"
          FROM 
            "cameras" as c
          INNER JOIN "rooms" as r ON
            r."id" = c."room_id"
          INNER JOIN "model" as m ON
            m."id" = r."model_id"
          WHERE c."room_id" IS NOT NULL
          AND c."tracker_port" > 0;
          `
        );
        if (res.rowCount === 0) {
          await pClient.query("ROLLBACK");
          return -2;
        }
        const cameraData: CameraJob[] = res.rows;
        const roomEmps: { [roomId: number]: GetEmployeeProfile[] } = {};
        for (const camera of cameraData) {
          if (!camera.roomId) {
            await pClient.query("ROLLBACK");
            return -1;
          }
          if (camera.roomId in roomEmps) {
            camera.emps = roomEmps[camera.roomId];
            continue;
          }
          const resEmp = await pClient.query(
            `
          SELECT 
            u."id",
            u."user_name" as "userName",
            u."first_name" as "firstName",
            u."last_name" as "lastName",
            u."img_URL" as "imgURL",
            u."phone_no" as "phoneNumber"
          FROM 
            "room_employee" as re 
          INNER JOIN "users" as u ON
            re."employee_id" = u."id"
            AND u."type" = 'employee'
          WHERE re."room_id" = $1::int;`,
            [camera.roomId]
          );
          if (resEmp.rowCount === 0) {
            await pClient.query("ROLLBACK");
            return -1;
          }
          const userData: GetEmployeeProfile[] = resEmp.rows;
          for (const user of userData) {
            const resImg = await pClient.query(
              `
            SELECT 
              mei."id",
              mei."created_at" as "createdAt",
              mei."img_path" as "imgPath"
            FROM "employee_img" as mei
            WHERE 
              mei."employee_id" = $1::int
            ORDER BY 
              mei."created_at";
            `,
              [user.id]
            );
            if (resImg.rowCount === 0) {
              await pClient.query("ROLLBACK");
              return -1;
            }
            const imgData: ModelEmployeeImg[] = resImg.rows;
            user.images = imgData;
          }
          camera.emps = userData;
          roomEmps[camera.roomId] = userData;
        }
        await pClient.query("COMMIT");
        return cameraData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        if (pClient) {
          await pClient.query("ROLLBACK");
        }
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async insertUserDataIfNotExists(
    employeeId: number,
    roomId: number,
    date: string
  ) {
    return await this.retryQuery("insertUserDataIfNotExists", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        await pClient.query("BEGIN");
        const resCheck = await pClient.query(
          `
          SELECT "id" FROM "employee_data"
          WHERE 
            "room_id" = $1::int AND
            "date" = $2::date AND
            "employee_id" = $3::int
          `,
          [roomId, date, employeeId]
        );
        if (resCheck.rowCount === 1) {
          await pClient.query("ROLLBACK");
          return {
            employeeId,
          };
        }
        const res = await pClient.query(
          `
         INSERT INTO "employee_data" ("employee_id", 
         "room_id", "date") 
         VALUES ($1::int, $2::int, $3::date) RETURNING id;`,
          [employeeId, roomId, date]
        );
        if (res.rowCount !== 1) {
          await pClient.query("ROLLBACK");
          return -1;
        }
        await pClient.query("COMMIT");
        return {
          employeeId,
        };
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        if (pClient) {
          await pClient.query("ROLLBACK");
        }
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async updateUserData(
    employeeIds: number[],
    roomId: number,
    date: string,
    increValue: number = INTERVAL_SEC
  ) {
    return await this.retryQuery("updateUserData", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        await pClient.query("BEGIN");
        const resCheck = await pClient.query(
          format(
            `
          UPDATE "employee_data"
          SET "total_time_spent" = "total_time_spent" + $3::int
          WHERE
          "room_id" = $1::int AND
          "date" = $2::date AND
          "employee_id" IN (%L)
          `,
            employeeIds
          ),
          [roomId, date, increValue]
        );
        if (resCheck.rowCount === 0) {
          await pClient.query("ROLLBACK");
          return -1;
        }
        await pClient.query("COMMIT");
        return true;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        if (pClient) {
          await pClient.query("ROLLBACK");
        }
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
}

class MiscDB extends DB {
  async addDummyEmployeeData() {
    return await this.retryQuery("addDummyEmployeeData", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const company = getCompanyMetadata();
        if (company === null) {
          return null;
        }
        await pClient.query("BEGIN");
        const res = await pClient.query(
          `
         SELECT 
         re."room_id",
         re."employee_id",
         re."id"
         FROM "room_employee" as re;`
        );
        if (res.rowCount === 0) {
          await pClient.query("ROLLBACK");
          return -1;
        }
        const empRooms: any = res.rows;
        const past = 31;
        const totalRoomsByEmpid: { [empId: number]: number } = {};
        for (const empRoom of empRooms) {
          for (let i = 1; i <= past; i++) {
            let minRand = 0;
            let maxRand = 0;
            if (!(parseInt(empRoom["employee_id"]) in totalRoomsByEmpid)) {
              const res1 = await pClient.query(
                `
                SELECT 
                COUNT(re."room_id") as "total_rooms"
                FROM "room_employee" as re
                WHERE re."employee_id" = $1::int;`,
                [parseInt(empRoom["employee_id"])]
              );
              if (res1.rowCount !== 1) {
                await pClient.query("ROLLBACK");
                return -1;
              }
              totalRoomsByEmpid[parseInt(empRoom["employee_id"])] = parseInt(
                res1.rows[0]["total_rooms"]
              );
            }
            maxRand =
              company.workHours /
              totalRoomsByEmpid[parseInt(empRoom["employee_id"])];
            minRand = maxRand / 2;
            const totalHoursInOneDay = randNum(minRand, maxRand);
            const timeInSeconds = Math.round(totalHoursInOneDay * 60 * 60);
            const resData = await pClient.query(
              `
              INSERT INTO "employee_data" 
              ("employee_id", "room_id", "date",
              "created_at",
              "total_time_spent")
              VALUES
              ($1::int, $2::int, 
              (CURRENT_DATE - ($3::varchar || ' day')::INTERVAL)::date, 
              (CURRENT_TIMESTAMP - ($3::varchar || ' day')::INTERVAL)::timestamp,
              $4::int)
              RETURNING id, date;
           `,
              [
                parseInt(empRoom["employee_id"]),
                parseInt(empRoom["room_id"]),
                `${i}`,
                timeInSeconds,
              ]
            );
            if (resData.rowCount !== 1) {
              await pClient.query("ROLLBACK");
              return -1;
            }
            console.log(
              chalk.yellow(
                `Inserted date: empId - ${empRoom["employee_id"]}, 
              roomId - ${empRoom["room_id"]}, date - ${resData.rows[0][
                  "date"
                ].toDateString()}, 
              totalTime - ${timeInSeconds}`.replace(/\s+/g, " ")
              )
            );
          }
        }
        await pClient.query("COMMIT");
        return true;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        if (pClient) {
          await pClient.query("ROLLBACK");
        }
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
}

class StatisticsDBv1 extends DB {
  async getDashboard() {
    return await this.retryQuery("getDashboard", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        // Divide work hours by 2 as there are multiple rooms
        const company = getCompanyMetadata();
        if (company === null) {
          return null;
        }
        const res = await pClient.query(
          `
          SELECT 
            re."id",
            re."room_id" as "roomId",
            re."employee_id" as "empId",
            e."first_name" || ' ' || e."last_name" as "name",
            e."phone_no" as "phoneNo",
            e."img_URL" as "avatar",
            'Active' as "status",
            r."room_name" as "room"
          FROM 
            "room_employee" as re
          INNER JOIN 
            "users" as e ON
          re."employee_id" = e."id" AND
          e."type" = 'employee'
          INNER JOIN 
            "rooms" as r ON
          re."room_id" = r."id"`
        );
        const empRoomData: any = res.rows;
        for (const empRoom of empRoomData) {
          const resHours = await pClient.query(
            `
            SELECT 
              SUM("total_time_spent") as "total_time",
              COUNT("id") as "total_rows"
            FROM employee_data 
            WHERE date >= (CURRENT_DATE - ($3::varchar || ' day')::INTERVAL)::date 
            AND date < (CURRENT_DATE - ($4::varchar || ' day')::INTERVAL)::date 
            AND employee_id = $1::int AND room_id = $2::int;
          `,
            [empRoom["empId"], empRoom["roomId"], "7", "0"]
          );
          if (resHours.rowCount != 1) {
            return -1;
          }
          const totalTimeInWeek = parseInt(resHours.rows[0]["total_time"]);
          const totalHours = parseFloat(
            (totalTimeInWeek / (60 * 60)).toFixed(2)
          );
          empRoom.hoursThisWeek = totalHours;
          // Come back here
          empRoom.productivity = parseFloat(
            ((totalHours / (company.workHours * 7)) * 100).toFixed(2)
          );
          const resHoursPast = await pClient.query(
            `
            SELECT 
              SUM("total_time_spent") as "total_time",
              COUNT("id") as "total_rows"
            FROM employee_data 
            WHERE date >= (CURRENT_DATE - ($3::varchar || ' day')::INTERVAL)::date 
            AND date < (CURRENT_DATE - ($4::varchar || ' day')::INTERVAL)::date 
            AND employee_id = $1::int AND room_id = $2::int;
          `,
            [empRoom["empId"], empRoom["roomId"], "14", "7"]
          );
          if (resHoursPast.rowCount != 1) {
            return -1;
          }
          const totalTimeInWeekPast = parseInt(
            resHoursPast.rows[0]["total_time"]
          );
          const totalHoursPast = parseFloat(
            (totalTimeInWeekPast / (60 * 60)).toFixed(2)
          );
          empRoom.trend = parseFloat(
            (((totalHours - totalHoursPast) / totalHoursPast) * 100).toFixed(2)
          );
        }
        const weekData = [];
        for (let i = 0; i < 4; i++) {
          const resWeek = await pClient.query(
            `
            SELECT 
              SUM("total_time_spent") as "total_time",
              COUNT("id") as "total_rows"
            FROM employee_data 
            WHERE date >= (CURRENT_DATE - ($1::varchar || ' day')::INTERVAL)::date 
            AND date < (CURRENT_DATE - ($2::varchar || ' day')::INTERVAL)::date;
          `,
            [`${i * 7 + 7}`, `${i * 7}`]
          );
          if (resWeek.rowCount != 1) {
            return -1;
          }
          if (resWeek.rows[0]["total_rows"] === 0) {
            break;
          }
          const totalRows = parseInt(resWeek.rows[0]["total_rows"]);
          const totalTime = parseInt(resWeek.rows[0]["total_time"]);
          const totalHours = parseFloat((totalTime / (60 * 60)).toFixed(2));
          const avgProd = parseFloat(
            ((totalHours / (totalRows * company.workHours)) * 100).toFixed(2)
          );
          const weekObj = {
            week: `Week ${i + 1}`,
            totalHours: totalHours,
            avgProductivity: avgProd,
          };
          weekData.push(weekObj);
        }
        const hoursWeek = [];
        const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        for (let i = 0; i < 7; i++) {
          const resWeek = await pClient.query(
            `
            SELECT 
              SUM("total_time_spent") as "total_time",
              COUNT("id") as "total_rows"
            FROM employee_data 
            WHERE date = (CURRENT_DATE - ($1::varchar || ' day')::INTERVAL)::date;
          `,
            [`${i + 1}`]
          );
          if (resWeek.rowCount != 1) {
            return -1;
          }
          const resDate = await pClient.query(
            `
            SELECT
            (CURRENT_DATE - ($1::varchar || ' day')::INTERVAL)::date as "date";
            `,
            [`${i + 1}`]
          );
          if (resDate.rowCount != 1) {
            return -1;
          }
          const date1: string = resDate.rows[0]["date"];
          const totalTime = parseInt(resWeek.rows[0]["total_time"]);
          const totalHours = parseFloat((totalTime / (60 * 60)).toFixed(2));
          const resWeekPast = await pClient.query(
            `
            SELECT 
              SUM("total_time_spent") as "total_time",
              COUNT("id") as "total_rows"
            FROM employee_data 
            WHERE date = (CURRENT_DATE - ($1::varchar || ' day')::INTERVAL)::date;
          `,
            [`${i + 1 + 7}`]
          );
          if (resWeekPast.rowCount != 1) {
            return -1;
          }
          const totalTimePast = parseInt(resWeekPast.rows[0]["total_time"]);
          const totalHoursPast = parseFloat(
            (totalTimePast / (60 * 60)).toFixed(2)
          );
          const weekDay = new Date(date1).getDay();
          const hourWeekObj = {
            day: daysOfWeek[weekDay],
            "This Week": totalHours,
            "Last Week": totalHoursPast,
          };
          hoursWeek.push(hourWeekObj);
        }
        hoursWeek.reverse();
        const res1 = await pClient.query(
          `
          SELECT 
          DISTINCT re."employee_id" as "empId",
          e."first_name" || ' ' || e."last_name" as "name",
          e."img_URL" as "avatar"
          FROM 
            "room_employee" as re
          INNER JOIN 
            "users" as e ON
          re."employee_id" = e."id" AND
          e."type" = 'employee'`
        );
        const empRoomData1 = res1.rows;
        const productivityData = [];
        for (const empRoom of empRoomData1) {
          const resHour = await pClient.query(
            `
            SELECT 
              SUM("total_time_spent") as "total_time",
              COUNT("id") as "total_rows"
            FROM employee_data 
            WHERE employee_id = $1::int;
          `,
            [empRoom["empId"]]
          );
          if (resHour.rowCount != 1) {
            return -1;
          }
          const totalRows = parseInt(resHour.rows[0]["total_rows"]);
          const totalTime = parseInt(resHour.rows[0]["total_time"]);
          const totalHours = parseFloat((totalTime / (60 * 60)).toFixed(2));
          const prodHour = parseFloat(
            ((totalHours / (company.workHours * totalRows)) * 100).toFixed(2)
          );
          const prodObj = {
            empId: empRoom["empId"],
            name: empRoom["name"],
            hours: totalHours,
            productivity: prodHour,
            avatar: empRoom["avatar"],
          };
          productivityData.push(prodObj);
        }
        const res2 = await pClient.query(
          `
          SELECT 
            DISTINCT re."room_id" as "roomId",
            r."room_name" as "name"
          FROM 
            "room_employee" as re
          INNER JOIN 
            "rooms" as r ON
          re."room_id" = r."id"`
        );
        const empRoomData2 = res2.rows;
        const departmentHoursData = [];
        for (const empRoom of empRoomData2) {
          const resHour = await pClient.query(
            `
            SELECT 
              SUM("total_time_spent") as "total_time",
              COUNT("id") as "total_rows"
            FROM employee_data 
            WHERE room_id = $1::int;
          `,
            [empRoom["roomId"]]
          );
          if (resHour.rowCount != 1) {
            return -1;
          }
          const totalRows = parseInt(resHour.rows[0]["total_rows"]);
          const totalTime = parseInt(resHour.rows[0]["total_time"]);
          const totalHours = parseFloat((totalTime / (60 * 60)).toFixed(2));
          const prodObj = {
            name: empRoom["name"],
            hours: totalHours,
          };
          departmentHoursData.push(prodObj);
        }
        const productivityData1 = [...productivityData];
        const topPerformers: any[] = productivityData1
          .sort((a, b) => b.productivity - a.productivity)
          .slice(0, 3);
        for (const emp of topPerformers) {
          const resHour = await pClient.query(
            `
            SELECT 
              SUM("total_time_spent") as "total_time",
              COUNT("id") as "total_rows"
            FROM employee_data 
            WHERE employee_id = $1::int AND
            date >= (CURRENT_DATE - ($2::varchar || ' day')::INTERVAL)::date 
            AND date < (CURRENT_DATE - ($3::varchar || ' day')::INTERVAL)::date ;
          `,
            [emp.empId, "7", "0"]
          );
          if (resHour.rowCount != 1) {
            return -1;
          }
          const totalRows = parseInt(resHour.rows[0]["total_rows"]);
          const totalTime = parseInt(resHour.rows[0]["total_time"]);
          const totalHours = parseFloat((totalTime / (60 * 60)).toFixed(2));
          const resHourPast = await pClient.query(
            `
            SELECT 
              SUM("total_time_spent") as "total_time",
              COUNT("id") as "total_rows"
            FROM employee_data 
            WHERE employee_id = $1::int AND
            date >= (CURRENT_DATE - ($2::varchar || ' day')::INTERVAL)::date 
            AND date < (CURRENT_DATE - ($3::varchar || ' day')::INTERVAL)::date ;
          `,
            [emp.empId, "14", "7"]
          );
          if (resHourPast.rowCount != 1) {
            return -1;
          }
          const totalRowsPast = parseInt(resHourPast.rows[0]["total_rows"]);
          const totalTimePast = parseInt(resHourPast.rows[0]["total_time"]);
          const totalHoursPast = parseFloat(
            (totalTimePast / (60 * 60)).toFixed(2)
          );
          emp.increase = parseFloat(
            (((totalHours - totalHoursPast) / totalHoursPast) * 100).toFixed(2)
          );
        }
        const skillMatrixData = [];
        for (let i = 0; i < 7; i++) {
          const resWeek = await pClient.query(
            `
            SELECT 
              SUM("total_time_spent") as "total_time",
              COUNT("id") as "total_rows"
            FROM employee_data 
            WHERE date = (CURRENT_DATE - ($1::varchar || ' day')::INTERVAL)::date
            GROUP BY "employee_id"
            ORDER BY "total_time";
          `,
            [`${i + 1}`]
          );
          if (resWeek.rowCount === 0) {
            break;
          }
          const resDate = await pClient.query(
            `
            SELECT
            (CURRENT_DATE - ($1::varchar || ' day')::INTERVAL)::date as "date";
            `,
            [`${i + 1}`]
          );
          if (resDate.rowCount != 1) {
            return -1;
          }
          const date1: string = resDate.rows[0]["date"];
          let A = 0;
          let B = 0;
          for (const row1 of resWeek.rows) {
            const totalRows = parseInt(row1["total_rows"]);
            const totalTime = parseInt(row1["total_time"]);
            const totalHours = parseFloat((totalTime / (60 * 60)).toFixed(2));
            A += totalHours;
            B = totalHours;
          }
          const weekDay = new Date(date1).getDay();
          A = parseFloat((A / resWeek.rows.length).toFixed(2));
          const hourWeekObj = {
            subject: daysOfWeek[weekDay],
            A,
            B,
            fullMark: company.workHours,
          };
          skillMatrixData.push(hourWeekObj);
        }
        return {
          employeeData: empRoomData,
          weeklyTrendData: weekData,
          hoursWorkedData: hoursWeek,
          productivityData,
          departmentHoursData,
          topPerformers,
          skillMatrixData,
        };
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async getDashboardByUserId(userId: number) {
    return await this.retryQuery("getDashboardByUserId", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        // Divide work hours by 2 as there are multiple rooms
        const company = getCompanyMetadata();
        if (company === null) {
          return null;
        }
        const res = await pClient.query(
          `
          SELECT 
            e."first_name" as "firstName",
            e."last_name" as "lastName",
            e."phone_no" as "phoneNo",
            e."img_URL" as "avatar",
            'Active' as "status"
          FROM 
            "users" as e
          WHERE e."id" = $1::int 
          AND e."type" = 'employee';`,
          [userId]
        );
        if (res.rowCount !== 1) {
          return -1;
        }
        const employeeInfo = res.rows[0];
        const resBasic = await pClient.query(
          `
            SELECT 
              SUM("total_time_spent") as "total_time",
              COUNT("id") as "total_rows"
            FROM employee_data 
            WHERE employee_id = $1::int;`,
          [userId]
        );
        if (resBasic.rowCount !== 1) {
          return -1;
        }
        const resBasic1 = await pClient.query(
          `
            SELECT 
              DISTINCT date
            FROM employee_data
            WHERE employee_id = $1::int;`,
          [userId]
        );
        const totalDaysBasic = resBasic1.rowCount || 1;
        const totalRowsBasic = parseInt(resBasic.rows[0]["total_rows"]);
        const totalTimeBasic = parseInt(resBasic.rows[0]["total_time"]);
        const totalHoursBasic = parseFloat(
          (totalTimeBasic / (60 * 60)).toFixed(2)
        );
        // Take 16 hours as workHours as u messed up
        // change this in future after data reset
        const avgProdBasic = parseFloat(
          (
            (totalHoursBasic / (totalDaysBasic * company.workHours * 2)) *
            100
          ).toFixed(2)
        );
        const basicInfo = {
          totalHours: totalHoursBasic,
          averageProductivy: avgProdBasic,
        };
        const hoursWeek = [];
        const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        for (let i = 0; i < 7; i++) {
          const resWeek = await pClient.query(
            `
            SELECT 
              SUM("total_time_spent") as "total_time",
              COUNT("id") as "total_rows"
            FROM employee_data 
            WHERE date = (CURRENT_DATE - ($1::varchar || ' day')::INTERVAL)::date
            AND employee_id = $2::int;
          `,
            [`${i + 1}`, userId]
          );
          if (resWeek.rowCount != 1) {
            return -1;
          }
          const resDate = await pClient.query(
            `
            SELECT
            (CURRENT_DATE - ($1::varchar || ' day')::INTERVAL)::date as "date";
            `,
            [`${i + 1}`]
          );
          if (resDate.rowCount != 1) {
            return -1;
          }
          const date1: string = resDate.rows[0]["date"];
          const totalTime = parseInt(resWeek.rows[0]["total_time"]);
          const totalHours = parseFloat((totalTime / (60 * 60)).toFixed(2));
          const resWeekPast = await pClient.query(
            `
            SELECT 
              SUM("total_time_spent") as "total_time",
              COUNT("id") as "total_rows"
            FROM employee_data 
            WHERE date = (CURRENT_DATE - ($1::varchar || ' day')::INTERVAL)::date
            AND employee_id = $2::int;
          `,
            [`${i + 1 + 7}`, userId]
          );
          if (resWeekPast.rowCount != 1) {
            return -1;
          }
          const totalTimePast = parseInt(resWeekPast.rows[0]["total_time"]);
          const totalHoursPast = parseFloat(
            (totalTimePast / (60 * 60)).toFixed(2)
          );
          const weekDay = new Date(date1).getDay();
          const hourWeekObj = {
            day: daysOfWeek[weekDay],
            "This Week": totalHours,
            "Last Week": totalHoursPast,
          };
          hoursWeek.push(hourWeekObj);
        }
        hoursWeek.reverse();
        const res1 = await pClient.query(
          `
          SELECT 
          DISTINCT re."employee_id" as "empId",
          e."first_name" || ' ' || e."last_name" as "name",
          e."img_URL" as "avatar"
          FROM 
            "room_employee" as re
          INNER JOIN 
            "users" as e ON
          re."employee_id" = e."id" AND
          e."type" = 'employee'`
        );
        const empRoomData1 = res1.rows;
        const productivityData = [];
        for (const empRoom of empRoomData1) {
          const resHour = await pClient.query(
            `
            SELECT 
              SUM("total_time_spent") as "total_time",
              COUNT("id") as "total_rows"
            FROM employee_data 
            WHERE employee_id = $1::int;
          `,
            [empRoom["empId"]]
          );
          if (resHour.rowCount != 1) {
            return -1;
          }
          const totalRows = parseInt(resHour.rows[0]["total_rows"]);
          const totalTime = parseInt(resHour.rows[0]["total_time"]);
          const totalHours = parseFloat((totalTime / (60 * 60)).toFixed(2));
          const prodHour = parseFloat(
            ((totalHours / (company.workHours * totalRows)) * 100).toFixed(2)
          );
          const prodObj = {
            empId: empRoom["empId"],
            name: empRoom["name"],
            hours: totalHours,
            productivity: prodHour,
            avatar: empRoom["avatar"],
          };
          productivityData.push(prodObj);
        }
        const res2 = await pClient.query(
          `
          SELECT 
            DISTINCT re."room_id" as "roomId",
            r."room_name" as "name"
          FROM 
            "room_employee" as re
          INNER JOIN 
            "rooms" as r ON
          re."room_id" = r."id"
          WHERE re."employee_id" = $1::int;`,
          [userId]
        );
        const empRoomData2 = res2.rows;
        const departmentHoursData = [];
        for (const empRoom of empRoomData2) {
          const resHour = await pClient.query(
            `
            SELECT 
              SUM("total_time_spent") as "total_time",
              COUNT("id") as "total_rows"
            FROM employee_data 
            WHERE room_id = $1::int;
          `,
            [empRoom["roomId"]]
          );
          if (resHour.rowCount != 1) {
            return -1;
          }
          const totalRows = parseInt(resHour.rows[0]["total_rows"]);
          const totalTime = parseInt(resHour.rows[0]["total_time"]);
          const totalHours = parseFloat((totalTime / (60 * 60)).toFixed(2));
          const prodObj = {
            name: empRoom["name"],
            hours: totalHours,
          };
          departmentHoursData.push(prodObj);
        }
        const productivityData1 = [...productivityData];
        const topPerformers: any[] = productivityData1
          .sort((a, b) => b.productivity - a.productivity)
          .slice(0, 3);
        for (const emp of topPerformers) {
          const resHour = await pClient.query(
            `
            SELECT 
              SUM("total_time_spent") as "total_time",
              COUNT("id") as "total_rows"
            FROM employee_data 
            WHERE employee_id = $1::int AND
            date >= (CURRENT_DATE - ($2::varchar || ' day')::INTERVAL)::date 
            AND date < (CURRENT_DATE - ($3::varchar || ' day')::INTERVAL)::date ;
          `,
            [emp.empId, "7", "0"]
          );
          if (resHour.rowCount != 1) {
            return -1;
          }
          const totalRows = parseInt(resHour.rows[0]["total_rows"]);
          const totalTime = parseInt(resHour.rows[0]["total_time"]);
          const totalHours = parseFloat((totalTime / (60 * 60)).toFixed(2));
          const resHourPast = await pClient.query(
            `
            SELECT 
              SUM("total_time_spent") as "total_time",
              COUNT("id") as "total_rows"
            FROM employee_data 
            WHERE employee_id = $1::int AND
            date >= (CURRENT_DATE - ($2::varchar || ' day')::INTERVAL)::date 
            AND date < (CURRENT_DATE - ($3::varchar || ' day')::INTERVAL)::date ;
          `,
            [emp.empId, "14", "7"]
          );
          if (resHourPast.rowCount != 1) {
            return -1;
          }
          const totalRowsPast = parseInt(resHourPast.rows[0]["total_rows"]);
          const totalTimePast = parseInt(resHourPast.rows[0]["total_time"]);
          const totalHoursPast = parseFloat(
            (totalTimePast / (60 * 60)).toFixed(2)
          );
          emp.increase = parseFloat(
            (((totalHours - totalHoursPast) / totalHoursPast) * 100).toFixed(2)
          );
        }
        const skillMatrixData = [];
        for (let i = 0; i < 7; i++) {
          const resWeek = await pClient.query(
            `
            SELECT 
              SUM("total_time_spent") as "total_time",
              COUNT("id") as "total_rows"
            FROM employee_data 
            WHERE date = (CURRENT_DATE - ($1::varchar || ' day')::INTERVAL)::date
            GROUP BY "employee_id"
            ORDER BY "total_time";
          `,
            [`${i + 1}`]
          );
          if (resWeek.rowCount === 0) {
            break;
          }
          const resDate = await pClient.query(
            `
            SELECT
            (CURRENT_DATE - ($1::varchar || ' day')::INTERVAL)::date as "date";
            `,
            [`${i + 1}`]
          );
          if (resDate.rowCount != 1) {
            return -1;
          }
          const date1: string = resDate.rows[0]["date"];
          let A = 0;
          let B = 0;
          for (const row1 of resWeek.rows) {
            const totalRows = parseInt(row1["total_rows"]);
            const totalTime = parseInt(row1["total_time"]);
            const totalHours = parseFloat((totalTime / (60 * 60)).toFixed(2));
            A += totalHours;
          }
          const weekDay = new Date(date1).getDay();
          A = parseFloat((A / resWeek.rows.length).toFixed(2));
          const resWeek1 = await pClient.query(
            `
            SELECT 
              SUM("total_time_spent") as "total_time",
              COUNT("id") as "total_rows"
            FROM employee_data 
            WHERE date = (CURRENT_DATE - ($1::varchar || ' day')::INTERVAL)::date
            AND employee_id = $2::int;
          `,
            [`${i + 1}`, userId]
          );
          if (resWeek1.rowCount !== 1) {
            break;
          }
          const totalRows = parseInt(resWeek1.rows[0]["total_rows"]);
          const totalTime = parseInt(resWeek1.rows[0]["total_time"]);
          const totalHours = parseFloat((totalTime / (60 * 60)).toFixed(2));
          B = totalHours;
          const hourWeekObj = {
            subject: daysOfWeek[weekDay],
            A,
            B,
            fullMark: company.workHours,
          };
          skillMatrixData.push(hourWeekObj);
        }
        return {
          employeeInfo,
          hoursWorkedData: hoursWeek,
          departmentHoursData,
          topPerformers,
          skillMatrixData,
          basicInfo,
        };
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async getNoti(userId?: number) {
    return await this.retryQuery("getNoti", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
         SELECT 
          "id",
          "message",
          "created_at" as "timestamp",
          "type"
         FROM "notifications"
         ORDER BY "timestamp" DESC;`
        );
        const notiData = res.rows;
        return notiData;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async addNoti(userId: number, message: string, type: string) {
    return await this.retryQuery("addNoti", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        console.log([userId, message, type]);
        await pClient.query("BEGIN");
        const res = await pClient.query(
          `
         INSERT INTO "notifications" ("user_id","message","type")
         VALUES ($1::int, $2::varchar, $3::varchar)
         RETURNING id;`,
          [userId, message, type]
        );
        if (res.rowCount !== 1) {
          await pClient.query("ROLLBACK");
          return -1;
        }
        await pClient.query("COMMIT");
        return { notiId: res.rows[0].id as number };
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        if (pClient) {
          await pClient.query("ROLLBACK");
        }
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
}

class SessionDB extends DB {
  async getSessionIdByAuthId(authId: string) {
    return await this.retryQuery("getSessionIdByAuthId", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
           SELECT "session_id" FROM "sessions" WHERE
           "user_id" = $1::varchar;`,
          [authId]
        );
        if (res.rowCount !== 1) {
          return -1;
        }
        const sessionId: string = res.rows[0].session_id;
        return sessionId;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
  async createSessionIdByAuthId(authId: string, sessionId: string) {
    return await this.retryQuery("createSessionIdByAuthId", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
            INSERT INTO "sessions" ("user_id","session_id") 
            VALUES ($1::varchar, $2::uuid) RETURNING "session_id";`,
          [authId, sessionId]
        );
        if (res.rowCount !== 1) {
          return -1;
        }
        return sessionId;
      } catch (error: any) {
        console.log(
          chalk.red("PostgresSQL Error: "),
          error?.message,
          error?.code
        );
        return null;
      } finally {
        if (pClient) {
          this.release(pClient);
        }
      }
    });
  }
}

export {
  DB,
  UserDBv1,
  SessionDB,
  MiscDB,
  ModelDBv1,
  TrackerDBv1,
  StatisticsDBv1,
};
