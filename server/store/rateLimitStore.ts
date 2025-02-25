import { RateLimitCache } from "../cache/redis";
import { serverConfigs } from "../configs/configs";
import NodeCache from "node-cache";

const { RATE_LIMIT_TIME_IN_MIN } = serverConfigs;

class RateLimitingStore {
  static store: NodeCache;
  constructor() {
    if (RateLimitingStore.store) {
      return;
    }
    RateLimitingStore.store = new NodeCache({
      stdTTL: RATE_LIMIT_TIME_IN_MIN * 60,
      checkperiod: 120,
    });
  }
  setCountByClerkUserId(userId: string) {
    try {
      RateLimitingStore.store.set(userId, 1, RATE_LIMIT_TIME_IN_MIN * 60);
      return 1;
    } catch (error: any) {
      console.log(error?.message, error?.count);
      return null;
    }
  }
  getCountByClerkUserId(userId: string) {
    try {
      const val: string | undefined = RateLimitingStore.store.get(userId);
      if (!val) {
        return null;
      }
      return parseInt(val);
    } catch (error: any) {
      console.log(error?.message, error?.count);
      return null;
    }
  }
  incrementCountByClerkUserId(userId: string) {
    try {
      const val = this.getCountByClerkUserId(userId);
      const ttl = RateLimitingStore.store.getTtl(userId);
      if (!val || !ttl) {
        return null;
      }
      const expireTime = (ttl - Date.now()) / 1000;
      RateLimitingStore.store.set(userId, val + 1, expireTime);
      return val + 1;
    } catch (error: any) {
      console.log(error?.message, error?.count);
      return null;
    }
  }
}

class RateLimitingStoreWithRedis {
  async setCountByClerkUserId(userId: string) {
    try {
      const mClient = new RateLimitCache();
      const val = await mClient.setCountByClerkUserId(userId);
      if (!val || val === -1) {
        const rlStore = new RateLimitingStore();
        const val = rlStore.setCountByClerkUserId(userId);
        return val;
      }
      return 1;
    } catch (error: any) {
      console.log(error?.message, error?.count);
      return null;
    }
  }
  async getCountByClerkUserId(userId: string) {
    try {
      const mClient = new RateLimitCache();
      const val = await mClient.getCountByClerkUserId(userId);
      if (!val) {
        const rlStore = new RateLimitingStore();
        const val = rlStore.getCountByClerkUserId(userId);
        if (!val) {
          return null;
        }
        return val;
      }
      if (val === -1) {
        return null;
      }
      return parseInt(val);
    } catch (error: any) {
      console.log(error?.message, error?.count);
      return null;
    }
  }
  async incrementCountByClerkUserId(userId: string) {
    try {
      const mClient = new RateLimitCache();
      const val = await mClient.incrementCountByClerkUserId(userId);
      if (!val || val === -1) {
        const rlStore = new RateLimitingStore();
        const val = rlStore.incrementCountByClerkUserId(userId);
        return val;
      }
      return parseInt(val);
    } catch (error: any) {
      console.log(error?.message, error?.count);
      return null;
    }
  }
}

export { RateLimitingStoreWithRedis };
