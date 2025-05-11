import cv2

# Open the default camera (usually webcam) → index 0
cap = cv2.VideoCapture("rtsp://test123:test123@172.20.10.4/stream1")

if not cap.isOpened():
    print("Cannot open camera")
    exit()

while True:
    # Capture frame-by-frame
    ret, frame = cap.read()
    if not ret:
        print("Can't receive frame (stream end?). Exiting...")
        break

    # Display the resulting frame
    cv2.imshow("Webcam Test", frame)

    # Press 'q' to exit
    if cv2.waitKey(1) == ord("q"):
        break

# Release the capture and close windows
cap.release()
cv2.destroyAllWindows()
