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

type AdminProfile = EmployeeProfile & {
  password: string;
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

const adminProfileSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string(),
  password: z.string(),
});

export { employeeProfileSchema, adminProfileSchema };
export type {
  ClerkInfo,
  EmployeeProfile,
  Notification,
  UpdateNoti,
  AdminProfile,
};
