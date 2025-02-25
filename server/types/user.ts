import { z } from "zod";

type ClerkInfo = {
  clerkId?: string;
};

type UpdateNoti = {
  notificationId?: number;
};


type EmployeeProfile = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
};

type Notification = {
  message: string;
  action: string;
  // Todo
  actionMessage: string;
  id: number;
  timestamp: string;
  seen?: boolean;
};

const employeeProfileSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string(),
});

export { employeeProfileSchema };
export type {
  ClerkInfo,
  EmployeeProfile,
  Notification,
  UpdateNoti,
};
