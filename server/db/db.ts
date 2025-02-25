import chalk from "chalk";
import { Pool, PoolClient } from "pg";
import { v4 } from "uuid";
import { Camera, Ping, Room } from "../types/db";
import { getRandomInteger } from "../helpers/randomNumber";
import { dbConfigs } from "../configs/configs";
import ShortUniqueId from "short-unique-id";
import { waitForNSeconds } from "../helpers/wait";
import { randNum } from "../helpers/random";
import { UserProfile } from "../types/user";

// Macros
const {
  DB_LIMIT_ROWS,
  DB_RETRY_QUERY,
  DB_RETRY_WAIT_MAX_SEC,
  DB_RETRY_WAIT_MIN_SEC,
} = dbConfigs;

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
  async getUserInfoByUserId(userId: string) {
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
  async createEmployeeUser(
    profileData: UserProfile,
    clerkId: string,
    imgURL: string
  ) {
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
          INSERT INTO "users" ("user_name", "clerk_id", "first_name",
          "last_name", "img_URL", "type", "phone_no") 
          VALUES ($1::varchar, $2::varchar,
          $3::varchar, $4::varchar, $5::varchar, $6::user_type,
          $7::varchar) RETURNING id;`,
          [
            userName,
            clerkId,
            profileData.firstName,
            profileData.lastName,
            imgURL,
            "employee",
            profileData.phoneNumber,
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
  // Admin User
  async createAdminUser(profileData: UserProfile, imgURL: string) {
    return await this.retryQuery("createAdminUser", async () => {
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
          "last_name", "img_URL", "type", "phone_no") 
          VALUES ($1::varchar, $2::varchar,
          $3::varchar, $4::varchar, $5::user_type,
          $6::varchar) RETURNING id;`,
          [
            userName,
            profileData.firstName,
            profileData.lastName,
            imgURL,
            "admin",
            profileData.phoneNumber,
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
}

class TrackerDBv1 extends DB {
  // Room and Camera operations
  async createRoom(roomName: string, userId: number) {
    return await this.retryQuery("createRoom", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
         INSERT INTO "rooms" ("room_name", "created_by") 
         VALUES ($1::varchar, $2::int) RETURNING id;`,
          [roomName, userId]
        );
        if (res.rowCount !== 1) {
          return -1;
        }
        const roomData = {
          roomId: res.rows[0].id as number,
        };
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
  async createAssignCamera(cameraName: string, roomId: number) {
    return await this.retryQuery("createAssignCamera", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
         INSERT INTO "rooms" ("camera_name", "room_id") 
         VALUES ($1::varchar, $2::int) RETURNING id;`,
          [cameraName, roomId]
        );
        if (res.rowCount !== 1) {
          return -1;
        }
        const cameraData = {
          cameraId: res.rows[0].id as number,
        };
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
            r."max_head_count" as "maxHeadCount",
            a."user_name" as "userName", 
            a."first_name" as "firstName",
            a."last_name" as "lastName,
            a."img_URL" as "imgURL",
            a."phone_no" as "phoneNo"
          FROM "rooms" as r
          INNER JOIN "users" a ON
          r."created_by" = a."id" AND
          a."type" = 'admin'`
        );
        const roomData: Room[] = res.rows;
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
  async getAssignedCameras() {
    return await this.retryQuery("getAssignedCameras", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
          SELECT 
            c."camera_name" as "cameraName",
            c."id" as "cameraId",
            r."room_name" as "roomName",
            r."id" as "roomId",
            r."max_head_count" as "maxHeadCount",
            a."user_name" as "userName", 
            a."first_name" as "firstName",
            a."last_name" as "lastName,
            a."img_URL" as "imgURL",
            a."phone_no" as "phoneNo"
          FROM 
            "cameras" as c 
          INNER JOIN 
            "rooms" as r
            ON c."room_id" = r."id"
          INNER JOIN 
            "users" as a ON
            r."created_by" = a."id" AND
            a."type" = 'admin'`
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
          return -1;
        }
        const roomData = {
          roomId: res.rows[0].id as number,
        };
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
  async updateAssignCamera(
    cameraName: number,
    roomId: number,
    cameraId: number
  ) {
    return await this.retryQuery("updateAssignCamera", async () => {
      let pClient;
      try {
        pClient = await this.connect();
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
          return -1;
        }
        const cameraData = {
          cameraId: res.rows[0].id as number,
        };
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
  async deleteRoom(roomId: number) {
    return await this.retryQuery("deleteRoom", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
          DELETE FROM "rooms" as r
          WHERE r."id" = $1::int RETURNING id;`,
          [roomId]
        );
        if (res.rowCount !== 1) {
          return -1;
        }
        const roomData = {
          roomId: res.rows[0].id as number,
        };
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
  async deleteAssignCamera(cameraId: number) {
    return await this.retryQuery("deleteAssignCamera", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
          DELETE FROM "cameras" as c
          WHERE c."id" = $1::int RETURNING id;`,
          [cameraId]
        );
        if (res.rowCount !== 1) {
          return -1;
        }
        const cameraData = {
          cameraId: res.rows[0].id as number,
        };
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
}

class ModelDBv1 extends DB {
  // Model and Employee Data operations
  async createModel(modelName: string, userId: number) {
    return await this.retryQuery("createModel", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
         INSERT INTO "model" ("model_name", "created_by") 
         VALUES ($1::varchar, $2::int) RETURNING id;`,
          [modelName, userId]
        );
        if (res.rowCount !== 1) {
          return -1;
        }
        const roomData = {
          roomId: res.rows[0].id as number,
        };
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
  async updateModel(modelName: string, modelId: number) {
    return await this.retryQuery("updateModel", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
         UPDATE ""model" as m
          SET
            m."model_name" = $1::varchar
         WHERE m."id" = $2::int RETURNING id;`,
          [modelName, modelId]
        );
        if (res.rowCount !== 1) {
          return -1;
        }
        const roomData = {
          roomId: res.rows[0].id as number,
        };
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
  async deleteModel(modelId: number) {
    return await this.retryQuery("deleteModel", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
          DELETE FROM "model" as m
          WHERE m."id" = $1::int RETURNING id;`,
          [modelId]
        );
        if (res.rowCount !== 1) {
          return -1;
        }
        const roomData = {
          roomId: res.rows[0].id as number,
        };
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
  async assignModelRoom(modelId: number, roomId: number) {
    return await this.retryQuery("assignModelRoom", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
         INSERT INTO "model_room" ("model_id", "room_id") 
         VALUES ($1::int, $2::int) RETURNING id;`,
          [modelId, roomId]
        );
        if (res.rowCount !== 1) {
          return -1;
        }
        const roomData = {
          roomId: res.rows[0].id as number,
        };
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
  async assignModelEmployee(modelId: number, employeeId: number) {
    return await this.retryQuery("assignModelEmployee", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
         INSERT INTO "model_employee" ("model_id", "room_id") 
         VALUES ($1::int, $2::int) RETURNING id;`,
          [modelId, employeeId]
        );
        if (res.rowCount !== 1) {
          return -1;
        }
        const roomData = {
          roomId: res.rows[0].id as number,
        };
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
  async addModelEmployeeImgPath(modelEmployeeId: number, imgPath: string) {
    return await this.retryQuery("addModelEmployeeImgPath", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
         INSERT INTO "model_employee_img" ("model_employee_id", 
         "img_path") 
         VALUES ($1::int, $2::varchar) RETURNING id;`,
          [modelEmployeeId, imgPath]
        );
        if (res.rowCount !== 1) {
          return -1;
        }
        const roomData = {
          roomId: res.rows[0].id as number,
        };
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
  async addEmployeeData(
    employeeId: number,
    roomId: number,
    totalHoursSpent: number
  ) {
    return await this.retryQuery("addEmployeeData", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
         INSERT INTO "employee_data ("employee_id", 
         "room_id", "total_hours_spent") 
         VALUES ($1::int, $2::int, $3::numeric) RETURNING id;`,
          [employeeId, roomId, totalHoursSpent]
        );
        if (res.rowCount !== 1) {
          return -1;
        }
        const roomData = {
          roomId: res.rows[0].id as number,
        };
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
}

class MiscDB extends DB {
  async flushAllUsers() {
    let pClient;
    try {
      pClient = await this.connect();
      const res = await pClient.query(
        `
        TRUNCATE TABLE "users", "candidate_metadata_v1", "recruiter_metadata_v1",
        "users_contact_details_v1" RESTART IDENTITY CASCADE;`
      );
      console.log(res);
      if (res.command !== "TRUNCATE") {
        return -1;
      }
      return "TRUNCATE";
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
  }
}

class SessionDB extends DB {
  async getSessionIdByClerkUserId(clerkUserId: string) {
    return await this.retryQuery("getSessionIdByClerkUserId", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
           SELECT "session_id" FROM "sessions" WHERE
           "clerk_id" = $1::varchar;`,
          [clerkUserId]
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
  async createSessionIdByClerkUserId(clerkUserId: string, sessionId: string) {
    return await this.retryQuery("createSessionIdByClerkUserId", async () => {
      let pClient;
      try {
        pClient = await this.connect();
        const res = await pClient.query(
          `
            INSERT INTO "sessions" ("clerk_id","session_id") 
            VALUES ($1::varchar, $2::uuid) RETURNING "session_id";`,
          [clerkUserId, sessionId]
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

export { DB, UserDBv1, SessionDB, MiscDB, ModelDBv1, TrackerDBv1 };
