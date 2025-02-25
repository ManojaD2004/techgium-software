type Cookies = {
  sessionId?: string;
  userId?: string;
  clerkId?: string;
};

type SessionId = string | -1 | null;

export type { Cookies, SessionId };
