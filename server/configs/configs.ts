import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const envConfigs = {
  ...process.env,
} as const;

const serverConfigs = {
  DB_CONNECTION_MAX_RETRY: 3, // if db connection failed how many time to retry
  DB_CONNECTION_RETRY_WAIT_TIME_IN_SEC: 2, // if db connection failed how many seconds to wait before retry
  RATE_LIMIT_TIME_IN_MIN: 15, // in mins
  RATE_LIMIT_MAX_CALL: 200 * 10, // how many call can we do
  SESSION_EXPIRE_TIME_IN_DAYS: 15, // how much time does the session id has in days
  BUCKET_NAME: "blueline-resumes",
  ZOOM_API_BASE_URL: "https://api.zoom.us/v2",
  ZOOM_AUTH_URL: "https://zoom.us/oauth/token",
  ZOOM_API_RETRY_REQUEST: 3,
  ZOOM_RETRY_WAIT_MIN_SEC: 1,
  ZOOM_RETRY_WAIT_MAX_SEC: 2,
  JOB_INTERVAL_HOUR: 1,
  CORS_ORIGIN: "https://reach-blueline-front-end.vercel.app",
} as const;

const dbConfigs = {
  DB_LIMIT_ROWS: 10,
  DB_RETRY_QUERY: 5,
  DB_RETRY_WAIT_MIN_SEC: 1,
  DB_RETRY_WAIT_MAX_SEC: 3,
} as const;

export { serverConfigs, envConfigs, dbConfigs };
