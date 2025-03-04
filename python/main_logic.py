from flask import Flask, render_template_string, Response
import cv2
import mediapipe as mp
import simple_facerec as sfr
import threading
import time

app = Flask(__name__)

face_rec = sfr.SimpleFacerec()
face_rec.load_encoding_images("images/")

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
pose_detector = mp_pose.Pose(
    static_image_mode=False, min_detection_confidence=0.5, model_complexity=1
)

face_rec_interval = 10
motion_update_interval = 30
motion_threshold = 5

last_face_locations = None
last_face_names = None


class VideoCaptureThread:
    def __init__(self, src="http://192.168.1.7:4747/video", width=640, height=480):
        self.cap = cv2.VideoCapture(src)
        self.cap.set(3, width)
        self.cap.set(4, height)
        self.frame = None
        self.stopped = False
        self.lock = threading.Lock()

    def start(self):
        t = threading.Thread(target=self.update, daemon=True)
        t.start()
        return self

    def update(self):
        while not self.stopped:
            ret, frame = self.cap.read()
            if not ret:
                self.stop()
                return
            with self.lock:
                self.frame = frame

    def read(self):
        with self.lock:
            return self.frame.copy() if self.frame is not None else None

    def stop(self):
        self.stopped = True
        self.cap.release()


video_thread = VideoCaptureThread().start()


def process_frame(
    frame, frame_idx, prev_pose_landmarks, motion_buffer, last_motion_state
):
    frame = cv2.flip(frame, 1)

    global last_face_locations, last_face_names
    if frame_idx % face_rec_interval == 0:
        last_face_locations, last_face_names = face_rec.detect_known_faces(frame)
    if last_face_locations is not None:
        for (top, right, bottom, left), name in zip(
            last_face_locations, last_face_names
        ):
            cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
            cv2.putText(
                frame,
                name,
                (left, top - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 255, 0),
                2,
            )
        head_count = len(last_face_locations)
        cv2.putText(
            frame,
            f"Head Count: {head_count}",
            (10, 70),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (255, 255, 0),
            2,
        )

    imageRGB = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose_detector.process(imageRGB)
    curr_pose_landmarks = None
    current_motion = 0

    if results.pose_landmarks:
        mp_drawing.draw_landmarks(
            frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS
        )
        h, w, _ = frame.shape
        curr_pose_landmarks = []
        for landmark in results.pose_landmarks.landmark:
            curr_pose_landmarks.append(
                (int(landmark.x * w), int(landmark.y * h), landmark.z * w)
            )
        if prev_pose_landmarks is not None and len(prev_pose_landmarks) == len(
            curr_pose_landmarks
        ):
            current_motion = sum(
                (((curr[0] - prev[0]) ** 2 + (curr[1] - prev[1]) ** 2) ** 0.5)
                for prev, curr in zip(prev_pose_landmarks, curr_pose_landmarks)
            ) / len(curr_pose_landmarks)

    motion_buffer.append(current_motion)
    if frame_idx % motion_update_interval == 0 and motion_buffer:
        avg_motion = sum(motion_buffer) / len(motion_buffer)
        last_motion_state = "Moving" if avg_motion > motion_threshold else "Idle"
        motion_buffer.clear()

    cv2.putText(
        frame,
        f"State: {last_motion_state}",
        (10, 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 0, 255),
        2,
    )

    return frame, curr_pose_landmarks, motion_buffer, last_motion_state


def gen_frames():
    frame_idx = 0
    prev_pose_landmarks = None
    motion_buffer = []
    last_motion_state = "Idle"
    while True:
        frame = video_thread.read()
        if frame is None:
            time.sleep(0.01)
            continue
        frame_idx += 1
        frame, curr_pose_landmarks, motion_buffer, last_motion_state = process_frame(
            frame, frame_idx, prev_pose_landmarks, motion_buffer, last_motion_state
        )
        prev_pose_landmarks = curr_pose_landmarks
        ret, buffer = cv2.imencode(".jpg", frame)
        if not ret:
            continue
        frame_bytes = buffer.tobytes()
        yield (
            b"--frame\r\n" b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
        )


html_template = """
<html>
<body>
    <img src="/video_feed" width="100%">
</body>
</html>
"""


@app.route("/")
def index():
    return html_template


@app.route("/video_feed")
def video_feed():
    return Response(gen_frames(), mimetype="multipart/x-mixed-replace; boundary=frame")


if __name__ == "__main__":
    try:
        app.run(host="0.0.0.0", port=5000)
    finally:
        video_thread.stop()
