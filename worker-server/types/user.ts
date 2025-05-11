import { z } from "zod";
import { ModelEmployeeImg } from "./db";

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
  password: string;
};

type GetEmployeeProfile = EmployeeProfile & {
  id: number;
  userName: string;
  imgURL: string;
  images: ModelEmployeeImg[]
};

type GetEmployeeProfileWithoutImg = EmployeeProfile & {
  id: number;
  userName: string;
  imgURL: string;
};

type GetModelEmployee = EmployeeProfile & {
  id: number;
  employeeId: number;
  totalImgUploaded: number;
};

type AdminProfile = EmployeeProfile & {
  password: string;
  userName: string;
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
  password: z.string(),
});

const adminProfileSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  userName: z.string(),
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
  GetEmployeeProfile,
  GetModelEmployee,
  GetEmployeeProfileWithoutImg,
};
