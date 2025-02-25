type Ping = {
  pong: string;
};

type Room = {
  roomName: string;
  roomId: number;
  userName: string;
  firstName: string;
  lastName: string;
  imgURL: string;
  phoneNo: string;
  maxHeadCount?: number;
};

type Camera = Room & {
  cameraId: number;
  cameraName: string;
}

export type { Ping, Room, Camera };
