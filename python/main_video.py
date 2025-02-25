# import cv2
# from simple_facerec import SimpleFacerec
# import threading
# import time

# # Threaded video capture class to continuously grab frames from the mobile stream.
# class ThreadedVideoStream:
#     def __init__(self, src):
#         self.cap = cv2.VideoCapture(src)
#         if not self.cap.isOpened():
#             raise Exception("Cannot open video stream")
#         self.ret, self.frame = self.cap.read()
#         self.stopped = False
#         self.lock = threading.Lock()
    
#     def start(self):
#         threading.Thread(target=self.update, daemon=True).start()
#         return self
    
#     def update(self):
#         while not self.stopped:
#             try:
#                 ret, frame = self.cap.read()
#             except cv2.error as e:
#                 print("Error reading frame:", e)
#                 self.stop()
#                 break
#             with self.lock:
#                 self.ret = ret
#                 self.frame = frame
#             time.sleep(0.005)
    
#     def read(self):
#         with self.lock:
#             frame = self.frame.copy() if self.frame is not None else None
#             ret = self.ret
#         return ret, frame
    
#     def stop(self):
#         self.stopped = True
#         self.cap.release()

# # Global variables and a lock to store the latest detection results.
# latest_face_locations = []
# latest_face_names = []
# detection_lock = threading.Lock()

# def detection_worker(sfr, video_stream, detection_interval=0.5):
#     """
#     Continuously grab the latest frame from the video stream and run face detection
#     at a fixed interval (in seconds). Update global detection results.
#     """
#     global latest_face_locations, latest_face_names
#     while True:
#         ret, frame = video_stream.read()
#         if not ret or frame is None:
#             time.sleep(detection_interval)
#             continue
#         # Run detection on a copy of the frame
#         face_locations, face_names = sfr.detect_known_faces(frame.copy())
#         with detection_lock:
#             latest_face_locations = face_locations
#             latest_face_names = face_names
#         time.sleep(detection_interval)  # Adjust interval as needed

# def main():
#     # Initialize face recognition and load known face encodings.
#     sfr = SimpleFacerec()
#     sfr.load_encoding_images("images/")  # Folder with known face images

#     # Use your mobile stream URL (try appending '/video' if needed)
#     stream_url = "http://192.168.1.3:4747/video"
#     try:
#         vs = ThreadedVideoStream(stream_url).start()
#     except Exception as e:
#         print("Error starting video stream:", e)
#         return

#     # Allow the stream to warm up.
#     time.sleep(2.0)

#     # Start a separate detection thread that processes a frame every 0.5 seconds.
#     detection_thread = threading.Thread(target=detection_worker, args=(sfr, vs, 0.5), daemon=True)
#     detection_thread.start()

#     while True:
#         ret, frame = vs.read()
#         if not ret or frame is None:
#             continue

#         # Safely copy the latest detection results.
#         with detection_lock:
#             face_locations = latest_face_locations.copy()
#             face_names = latest_face_names.copy()

#         # Draw detection results on the current frame.
#         for face_loc, name in zip(face_locations, face_names):
#             # face_loc is in [top, right, bottom, left] format.
#             y1, x2, y2, x1 = face_loc
#             cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 200), 2)
#             cv2.putText(frame, name, (x1, y1 - 10),
#                         cv2.FONT_ITALIC, 0.8, (0, 0, 200), 2)

#         # Count the number of faces and overlay it on the frame.
#         head_count = len(face_locations)
#         cv2.putText(frame, f"Head Count: {head_count}", (10, 30),
#                     cv2.FONT_ITALIC, 1, (0, 255, 0), 2)

#         cv2.imshow("Stream", frame)
#         key = cv2.waitKey(1) & 0xFF
#         if key == 27:  # Press 'ESC' key to exit.
#             break

#     vs.stop()
#     cv2.destroyAllWindows()

# if __name__ == "__main__":
#     main()
import cv2
import numpy as np
import threading
import time
from flask import Flask, Response, render_template_string
from simple_facerec import SimpleFacerec

class ThreadedVideoStream:
    def __init__(self, src):
        self.cap = cv2.VideoCapture(src)
        if not self.cap.isOpened():
            raise Exception("Cannot open video stream")
        self.ret, self.frame = self.cap.read()
        self.stopped = False
        self.lock = threading.Lock()
    
    def start(self):
        threading.Thread(target=self.update, daemon=True).start()
        return self
    
    def update(self):
        while not self.stopped:
            try:
                ret, frame = self.cap.read()
            except cv2.error as e:
                print("Error reading frame:", e)
                self.stop()
                break
            with self.lock:
                self.ret = ret
                self.frame = frame
            time.sleep(0.005)
    
    def read(self):
        with self.lock:
            frame = self.frame.copy() if self.frame is not None else None
            ret = self.ret
        return ret, frame
    
    def stop(self):
        self.stopped = True
        self.cap.release()

latest_face_locations = []
latest_face_names = []
detection_lock = threading.Lock()

def detection_worker(sfr, video_stream, detection_interval=0.5):
    global latest_face_locations, latest_face_names
    while True:
        ret, frame = video_stream.read()
        if not ret or frame is None:
            time.sleep(detection_interval)
            continue
        face_locations, face_names = sfr.detect_known_faces(frame.copy())
        with detection_lock:
            latest_face_locations = face_locations
            latest_face_names = face_names
        time.sleep(detection_interval)

app = Flask(__name__)

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

def generate_frames(sfr, video_stream):
    while True:
        ret, frame = video_stream.read()
        if not ret or frame is None:
            continue

        with detection_lock:
            face_locations = latest_face_locations.copy()
            face_names = latest_face_names.copy()
        
        for face_loc, name in zip(face_locations, face_names):
            y1, x2, y2, x1 = face_loc
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 200), 2)
            cv2.putText(frame, name, (x1, y1 - 10),
                        cv2.FONT_HERSHEY_DUPLEX, 0.8, (0, 0, 200), 2)
        
        head_count = len(face_locations)
        cv2.putText(frame, f"Head Count: {head_count}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
        frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route("/video_feed")
def video_feed():
    return Response(generate_frames(app.config["sfr"], app.config["video_stream"]),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

def main():
    sfr = SimpleFacerec()
    sfr.load_encoding_images("images/")
    stream_url = "http://192.168.1.3:4747/video"
    try:
        video_stream = ThreadedVideoStream(stream_url).start()
    except Exception as e:
        print("Error starting video stream:", e)
        return

    time.sleep(2.0)

    detection_thread = threading.Thread(target=detection_worker, args=(sfr, video_stream, 0.5), daemon=True)
    detection_thread.start()

    app.config["sfr"] = sfr
    app.config["video_stream"] = video_stream

    app.run(host="0.0.0.0", port=5000, debug=False)

if __name__ == "__main__":
    main()