import chalk from "chalk";
import { InterviewDbv1 } from "../db/db";
import {
  getZoomMeetingRecording,
  updateZoomMeetingSettings,
} from "../zoom/meeting";

async function updateMeetingRecordingLinkJob() {
  const interviewDb = new InterviewDbv1();
  const meetings = await interviewDb.getMeetingsIdWithNoRecordingLink();
  if (!meetings) {
    return;
  }
  for (const meeting of meetings) {
    const recordingSetting = await updateZoomMeetingSettings(
      meeting.zoomMeetingId
    ); // setting no password for recording
    if (recordingSetting !== true) {
      continue;
    }
    const recordingDetails = await getZoomMeetingRecording(
      meeting.zoomMeetingId
    );
    if (!recordingDetails) {
      continue;
    }
    const updateOutcome = await interviewDb.updateMeetingRecordingLink(
      meeting.zoomMeetingId,
      recordingDetails.shareURL
    );
    if (updateOutcome === true) {
      console.log(
        chalk.yellow(
          `${meeting.zoomMeetingId} of zoom meeting Id, is updated with recording link.`
        )
      );
    }
  }
}

export { updateMeetingRecordingLinkJob };
