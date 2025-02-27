type JsonOutputJob = {
  faceDetected: boolean;
  timestamp: number;
  headCount: number;
  empIds: string[];
  roomId: string;
  cameraId: string;
};

type ModelFeed = {
  [empId: string]: {
    empName: string;
    empUserName: string;
    empId: string;
    images: string[];
  };
};

export type { JsonOutputJob, ModelFeed };