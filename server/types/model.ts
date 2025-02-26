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
  cameras: z.number().int().array(),
  employees: z.number().int().array(),
});

export type { EmployeeData };

export { roomSchema };
