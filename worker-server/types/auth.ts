type Cookies = {
  sessionId?: string;
  userId?: string;
  authId?: string;
};

type SessionId = string | -1 | null;

export type { Cookies, SessionId };
