import { z } from "zod";

type EmployeeData = {
  id: number;
  employeeId: number;
  firstName: string;
  lastName: string;
  userName: string;
  roomId: number;
  date: string;
  totalHoursSpent: number;
};

const roomSchema = z.object({
  roomName: z.string(),
  modelId: z.number().int(),
  cameras: z.number().int().array().min(1),
  employees: z.number().int().array().min(1),
  maxHeadCount: z.number().int().optional(),
});

type RoomData = {
  roomName: string;
  modelId: number;
  cameras: number[];
  employees: number[];
  maxHeadCount?: number;
};

const cameraSchema = z.object({
  cameraName: z.string(),
  ip: z.string(),
  videoLink: z.string(),
  port: z.number().int(),
});

const modelSchema = z.object({
  modelName: z.string(),
  modelDesc: z.string(),
});

export type { EmployeeData, RoomData };

export { roomSchema, cameraSchema, modelSchema };
