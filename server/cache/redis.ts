import chalk from "chalk";
import { createClient, RedisClientType } from "redis";
import { serverConfigs } from "../configs/configs";

// Macros
const {
  SESSION_EXPIRE_TIME_IN_DAYS,
  DB_CONNECTION_MAX_RETRY,
  DB_CONNECTION_RETRY_WAIT_TIME_IN_SEC,
  RATE_LIMIT_TIME_IN_MIN,
} = serverConfigs;
class MemCache {
  static client: RedisClientType;
  constructor(connectionString: string);
  constructor();
  constructor(connectionString?: string) {
    if (MemCache.client) {
      return;
    }
    if (!connectionString) {
      console.log(chalk.red(`Initially need Connection String to connect!`));
      return;
    }
    MemCache.client = createClient({
      url: connectionString,
      socket: {
        reconnectStrategy: (retries) => {
          console.log(retries);
          if (retries > DB_CONNECTION_MAX_RETRY) {
            return new Error("Max retry reached! End reconnection Strategy!");
          }
          const jitter = Math.floor(Math.random() * 200);
          const delay = Math.min(
            Math.pow(2, retries) * 50,
            1000 * DB_CONNECTION_RETRY_WAIT_TIME_IN_SEC
          );
          return jitter + delay;
        },
        connectTimeout: 1000 * 10,
      },
    });
    MemCache.client.on("error", (err) => {
      console.log(chalk.red("Redis Error: "), err?.message, err?.code);
    });
    MemCache.client.on("ready", () => {
      console.log(chalk.yellowBright(`Connection Ready for Redis DB!`));
    });
  }

  // Connect if not connected already, else do nothing
  async connect() {
    if (MemCache.client.isReady || MemCache.client.isOpen) {
      return;
    }
    try {
      await MemCache.client.connect();
    } catch (error: any) {
      console.log(
        chalk.red("Redis Connect Error: "),
        error?.message,
        error?.code
      );
    }
  }
  // Clean up disconnect
  async disconnect() {
    if (!MemCache.client.isOpen && !MemCache.client.isReady) {
      return;
    }
    try {
      await MemCache.client.quit();
    } catch (error: any) {
      console.log(
        chalk.red("Redis Disconnect Error: "),
        error?.message,
        error?.code
      );
    }
  }
  isReady() {
    return MemCache.client.isReady;
  }
  async ping() {
    try {
      if (!this.isReady()) {
        this.connect();
        return null;
      }
      const mClient = this.getCacheInstance();
      const res = await mClient.ping("Hello Tiger, from Redis Cache DB!");
      return res;
    } catch (error: any) {
      console.log(
        chalk.red("Redis Command Error: "),
        error?.message,
        error?.code
      );
      return null;
    }
  }
  getCacheInstance() {
    return MemCache.client;
  }
}

class ClerkCache extends MemCache {
  async createSessionByClerkUserId(userId: string, sessionId: string) {
    try {
      if (!this.isReady()) {
        this.connect();
        return null;
      }
      const mClient = this.getCacheInstance();
      await mClient.set(`userid:${userId}`, sessionId, {
        EX: 60 * 60 * 24 * SESSION_EXPIRE_TIME_IN_DAYS, // in seconds
        NX: true,
      });
      return sessionId;
    } catch (error: any) {
      console.log(
        chalk.red("Redis Command Error: "),
        error?.message,
        error?.code
      );
      return null;
    }
  }
  async getSessionByClerkUserId(userId: string) {
    try {
      if (!this.isReady()) {
        this.connect();
        return null;
      }
      const mClient = this.getCacheInstance();
      const res = await mClient.get(`userid:${userId}`);
      if (res === null) {
        return -1;
      }
      return res;
    } catch (error: any) {
      console.log(
        chalk.red("Redis Command Error: "),
        error?.message,
        error?.code
      );
      return null;
    }
  }
}

class RateLimitCache extends MemCache {
  async incrementCountByClerkUserId(userId: string) {
    try {
      if (!this.isReady()) {
        this.connect();
        return null;
      }
      const mClient = this.getCacheInstance();
      const res = await mClient.incrBy(`rl:${userId}`, 1);
      if (res === null) {
        return -1;
      }
      return res.toString();
    } catch (error: any) {
      console.log(
        chalk.red("Redis Command Error: "),
        error?.message,
        error?.code
      );
      return null;
    }
  }
  async getCountByClerkUserId(userId: string) {
    try {
      if (!this.isReady()) {
        this.connect();
        return null;
      }
      const mClient = this.getCacheInstance();
      const res = await mClient.get(`rl:${userId}`);
      if (res === null) {
        return -1;
      }
      return res;
    } catch (error: any) {
      console.log(
        chalk.red("Redis Command Error: "),
        error?.message,
        error?.code
      );
      return null;
    }
  }
  async setCountByClerkUserId(userId: string) {
    try {
      if (!this.isReady()) {
        this.connect();
        return null;
      }
      const mClient = this.getCacheInstance();
      const res = await mClient.set(`rl:${userId}`, 1, {
        EX: 60 * RATE_LIMIT_TIME_IN_MIN, // in seconds
        NX: true,
      });
      if (res === null) {
        return -1;
      }
      return res;
    } catch (error: any) {
      console.log(
        chalk.red("Redis Command Error: "),
        error?.message,
        error?.code
      );
      return null;
    }
  }
}

export { MemCache, ClerkCache, RateLimitCache };
