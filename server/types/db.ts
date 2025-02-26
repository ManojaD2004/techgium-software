import { GetModelEmployee } from "./user";

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
  maxHeadCount?: number;
  modelId: number | null;
  modelName: string | null;
  cameras: Camera[]
};

type Camera = {
  cameraId: number;
  cameraName: string;
  videoLink: string;
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
  imgPath: string;
};

export type { Ping, Room, Camera, Model, ModelEmployeeImg };
