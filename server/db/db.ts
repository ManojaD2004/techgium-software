import chalk from "chalk";
import { Pool, PoolClient } from "pg";
import { v4 } from "uuid";
import { Ping } from "../types/db";
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
    userId: string,
    imgURL: string,
    emailId: string
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
          "last_name", "img_URL", "type", "email_id", "phone_no") 
          VALUES ($1::varchar, $2::varchar,
          $3::varchar, $4::varchar, $5::varchar, $6::user_type,
          $7::varchar, $8::varchar) RETURNING id;`,
          [
            userName,
            userId,
            profileData.firstName,
            profileData.lastName,
            imgURL,
            "employee",
            profileData.phoneNumber,
            emailId,
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
  async createAdminUser(
    profileData: UserProfile,
    userId: string,
    imgURL: string,
    emailId: string
  ) {
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
          INSERT INTO "users" ("user_name", "clerk_id", "first_name",
          "last_name", "img_URL", "type", "email_id", "phone_no") 
          VALUES ($1::varchar, $2::varchar,
          $3::varchar, $4::varchar, $5::varchar, $6::user_type,
          $7::varchar, $8::varchar) RETURNING id;`,
          [
            userName,
            userId,
            profileData.firstName,
            profileData.lastName,
            imgURL,
            "admin",
            profileData.phoneNumber,
            emailId,
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
  async createRoom(userId: number, roomName: string) {
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
  async assignCamera(cameraName: string, roomId: number) {
    return await this.retryQuery("assignCamera", async () => {
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

export { DB, UserDBv1, SessionDB, MiscDB };
