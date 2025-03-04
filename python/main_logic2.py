from flask import Flask, render_template_string, Response
import cv2
import mediapipe as mp
import simple_facerec2 as sfr
import threading
import time
import json
import sys

app = Flask(__name__)

face_rec = sfr.SimpleFacerec()

c = {}
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
pose_detector = mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5, model_complexity=1)

face_rec_interval = 10       
motion_update_interval = 30  
motion_threshold = 5

last_face_locations = []
last_face_names = []
last_motion_state1 = "Idle"

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
    
    def lock(self):
        return self.lock


def detection_worker(video_stream, detection_interval=0.5):
    global last_face_locations, last_face_names
    while True:
        frame = video_stream.read()
        if frame is None:
            print("in")
            time.sleep(detection_interval)
            continue
        face_locations, face_names = face_rec.detect_known_faces(frame.copy())
        last_face_locations = face_locations
        last_face_names = face_names
        time.sleep(detection_interval)


def process_frame(frame, frame_idx, prev_pose_landmarks, motion_buffer, last_motion_state):
    frame = cv2.flip(frame, 1)

    global last_face_locations, last_face_names
    if frame_idx % face_rec_interval == 0:
        last_face_locations, last_face_names = face_rec.detect_known_faces(frame)
    if len(last_face_locations) > 0:
        for (top, right, bottom, left), name in zip(last_face_locations, last_face_names):
            cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
            if name == "Unknown":
                cv2.putText(frame, name, (left, top - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
            else:
                cv2.putText(frame, c[name]["empName"], (left, top - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    head_count = len(last_face_locations)
    cv2.putText(frame, f"Head Count: {head_count}", (10, 70),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 0), 2)

    imageRGB = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose_detector.process(imageRGB)
    curr_pose_landmarks = None
    current_motion = 0

    if results.pose_landmarks:
        mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
        h, w, _ = frame.shape
        curr_pose_landmarks = []
        for landmark in results.pose_landmarks.landmark:
            curr_pose_landmarks.append((int(landmark.x * w), int(landmark.y * h), landmark.z * w))
        if prev_pose_landmarks is not None and len(prev_pose_landmarks) == len(curr_pose_landmarks):
            current_motion = sum(
                (((curr[0] - prev[0])**2 + (curr[1] - prev[1])**2)**0.5)
                for prev, curr in zip(prev_pose_landmarks, curr_pose_landmarks)
            ) / len(curr_pose_landmarks)

    motion_buffer.append(current_motion)
    if frame_idx % motion_update_interval == 0 and motion_buffer:
        avg_motion = sum(motion_buffer) / len(motion_buffer)
        last_motion_state = "Moving" if avg_motion > motion_threshold else "Idle"
        motion_buffer.clear()
    global last_motion_state1
    last_motion_state1 = last_motion_state
    cv2.putText(frame, f"State: {last_motion_state}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

    return frame, curr_pose_landmarks, motion_buffer, last_motion_state

def gen_frames():
    frame_idx = 0
    prev_pose_landmarks = None
    motion_buffer = []
    last_motion_state = "Idle"
    while True and video_thread != None:
        frame = video_thread.read()
        if frame is None:
            time.sleep(0.01)
            continue
        frame_idx += 1
        frame, curr_pose_landmarks, motion_buffer, last_motion_state = process_frame(
            frame, frame_idx, prev_pose_landmarks, motion_buffer, last_motion_state)
        prev_pose_landmarks = curr_pose_landmarks
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')


HTML_PAGE = """
<html>
  <head>
    <title>Live Camera</title>
  </head>
  <body>
    <img src="{{ url_for('video_feed') }}" width="800">
  </body>
</html>
"""

@app.route("/")
def index():
    return render_template_string(HTML_PAGE)


@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


def update_json(roomId, cameraId, interval_sec):
    """Background task to write face detection data to JSON every 5 seconds."""
    while True:
        if last_motion_state1 == "Idle":
            time.sleep(interval_sec)
            continue
        face_data = {
            "faceDetected": len(last_face_locations) > 0,
            "timestamp": time.time(),
            "headCount": len(last_face_locations),
            "empIds": last_face_names,
            "roomId": roomId,
            "cameraId": cameraId,
        }
        print(json.dumps(face_data), flush=True)
        time.sleep(interval_sec)

video_thread = None

def main():
    print(sys.argv)
    with open(sys.argv[1], "r") as file1:
        data1 = json.load(file1)
    # a = json.loads(data1)
    print(data1)
    global c
    c = data1
    face_rec.load_encoding_images(c)
    stream_url = sys.argv[2]
    room_id = sys.argv[3]
    camera_id = sys.argv[4]
    interval_sec = int(sys.argv[5])
    global video_thread
    time.sleep(2.0)
    json_thread = threading.Thread(
    target=update_json, args=(room_id, camera_id, interval_sec), daemon=True
    )
    video_thread = VideoCaptureThread(stream_url).start()
    # detect_thread = threading.Thread(
    #     target=detection_worker, args=(video_thread, interval_sec), daemon=True
    # )
    # detect_thread.start()
    json_thread.start()
    app.run(host='0.0.0.0', port=5000)


if __name__ == '__main__':
    main()
