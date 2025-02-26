import { GetEmployeeProfile } from "./user";

type Ping = {
  pong: string;
};

type AdminUser = {
  userName: string;
  firstName: string;
  lastName: string;
  imgURL: string;
  phoneNo: string;
};

type Room = AdminUser & {
  roomName: string;
  roomId: number;
  createdAt: string;
  maxHeadCount: number;
  modelId: number;
  modelName: string;
  cameras: Camera[];
  employees: GetEmployeeProfile[];
};

type Camera = {
  cameraId: number;
  cameraName: string;
  videoLink: string;
  ip: string;
  port: number;
  roomId: number | null;
};

type Model = AdminUser & {
  modelId: number;
  modelName: string;
  createdAt: string;
  modelDesc: string;
};

type ModelEmployeeImg = {
  createdAt: string;
  id: number;
  publicLink: string;
};

export type { Ping, Room, Camera, Model, ModelEmployeeImg };
