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

type Room = AdminUser  & {
  roomName: string;
  roomId: number;
  createdAt: string;
  maxHeadCount?: number;
  modelId: number | null;
  modelName: string | null;
};

type Camera = Room & {
  cameraId: number;
  cameraName: string;
}

type Model = AdminUser & {
  modelId: number;
  modelName: string;
  createdAt: string;
};

export type { Ping, Room, Camera, Model };
