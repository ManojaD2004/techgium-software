import { z } from "zod";

type ClerkInfo = {
  userId?: string;
};

type UpdateNoti = {
  notificationId?: number;
};

type RecruiterProfile = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  companyName: string;
  companyWebAddress: string;
  companyEmail: string;
  industry: string;
  companySize: string;
};

type GetRecruiterProfile = RecruiterProfile & {
  id: number;
  userName: string;
  edit: boolean;
  imgURL: string;
  type: string;
  createdAt: string;
};

const recruiterProfileSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string(),
  companyName: z.string(),
  companyWebAddress: z.string().url(),
  companyEmail: z.string().email(),
  industry: z.string(),
  companySize: z.string(),
});

type UserProfile = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  jobTitle: string;
  emailId?: string;
};

type GetUserProfile = UserProfile & {
  
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

const UserProfileSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string(),
});

export { recruiterProfileSchema, UserProfileSchema };
export type {
  ClerkInfo,
  RecruiterProfile,
  UserProfile,
  GetRecruiterProfile,
  GetUserProfile,
  Notification,
  UpdateNoti,
};
