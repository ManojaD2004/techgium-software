"use client";
import { useState, useRef, useEffect } from "react";
import API_LINK from "@/app/backendLink/link";
import toast from "react-hot-toast";
import {
  Video,
  Trash2,
  Network,
  Link2,
  MapPin,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function CameraManagement() {
  const [cameras, setCameras] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [show, setShow] = useState(true);
  const [previewImage1, setPreiviewImage1] = useState(""); 
  const [formData, setFormData] = useState({
    cameraName: "",
    ip: "",
    videoLink: "",
    needSafeArea: false,
    safeArea: null,
  });

  const [previewImage, setPreviewImage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [box, setBox] = useState(null);
  const [normalizedBox, setNormalizedBox] = useState(null); // New state for normalized coordinates
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);

  useEffect(() => {
    try {
      fetch(`${API_LINK}/user/v1/admin/get/cameras/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          setCameras(data.data.cameras);
          console.log(data);
        });
    } catch (err) {
      console.log(err);
    }
  }, []);

  // Convert pixel coordinates to normalized coordinates (0-1)
  useEffect(() => {
    if (box && imgRef.current) {
      const imgWidth = imgRef.current.naturalWidth;
      const imgHeight = imgRef.current.naturalHeight;
      
      // Create normalized coordinates (0-1 range)
      const normalized = {
        x: box.x / imgWidth,
        y: box.y / imgHeight,
        width: box.width / imgWidth,
        height: box.height / imgHeight
      };
      
      // Round to 3 decimal places for cleaner values
      for (const key in normalized) {
        normalized[key] = Math.round(normalized[key] * 1000) / 1000;
      }
      
      setNormalizedBox(normalized);
      console.log("Normalized coordinates (0-1):", normalized);
    } else {
      setNormalizedBox(null);
    }
  }, [box]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSafeAreaChoice = (choice) => {
    setFormData((prevData) => ({
      ...prevData,
      needSafeArea: choice === "yes",
    }));
  };

  const nextStep = async () => {
    if (currentStep === 1) {
      if (!formData.cameraName || !formData.ip || !formData.videoLink) {
        alert("Please fill in all fields");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (formData.needSafeArea) {
        setIsLoading(true);
        try {
          const res = await fetch(`${API_LINK}/user/v1/admin/camera/demo`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
            body: JSON.stringify({ videoLink: formData.videoLink }),
            credentials: "include",
          });
          if (!res.ok) {
            toast.error("Preview failed");
          }
          const data = await res.json();
          console.log(data.data);

          setPreviewImage(data.data.previewUrl);
          setPreiviewImage1(data.data.previewUrl);
          setCurrentStep(3);
        } catch (e) {
          console.error(e);
          toast.error("Failed to get preview image");
        } finally {
          setIsLoading(false);
        }
      } else {
        finalizeCameraAddition();
      }
    } else if (currentStep === 3) {
      finalizeCameraAddition();
    }
  };

  // Refresh preview image
  const refreshPreview = () => {
    setPreviewImage("/placeholder.webp");
    setTimeout(() => {
      setPreviewImage(previewImage1)
    }, 50)
  };

  const finalizeCameraAddition = async () => {
    if (formData.needSafeArea && normalizedBox) {
      setIsLoading(true);
      try {
        const payload = {
          cameraName: formData.cameraName,
          ip: formData.ip,
          videoLink: formData.videoLink,
          safeArea: normalizedBox, // Using normalized coordinates (0-1)
        };
        const res = await fetch(`${API_LINK}/user/v1/admin/create/camera`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(payload),
          credentials: "include",
        });
        if (!res.ok) {
          toast.error("Failed to save camera data");
        } else {
          toast.success("Camera added successfully");
          // Refresh camera list
          try {
            const res = await fetch(`${API_LINK}/user/v1/admin/get/cameras/all`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true",
              },
              credentials: "include",
            });
            const data = await res.json();
            setCameras(data.data.cameras);
          } catch (err) {
            console.log(err);
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error saving camera with safe area:", error);
        setIsLoading(false);
        alert("Failed to save camera data");
        return;
      }
    } else {
      try {
        const payload = {
          cameraName: formData.cameraName,
          ip: formData.ip,
          videoLink: formData.videoLink,
          safeArea: null,
        };
        const res = await fetch(`${API_LINK}/user/v1/admin/create/camera`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(payload),
          credentials: "include",
        });
        if (!res.ok) {
          toast.error("Failed to save camera data");
        } else {
          toast.success("Camera added successfully");
          // Refresh camera list
          try {
            const res = await fetch(`${API_LINK}/user/v1/admin/get/cameras/all`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true",
              },
              credentials: "include",
            });
            const data = await res.json();
            setCameras(data.data.cameras);
          } catch (err) {
            console.log(err);
          }
        }
      } catch (error) {
        console.error("Error saving camera:", error);
        alert("Failed to save camera data");
        return;
      }
    }

    setFormData({
      cameraName: "",
      ip: "",
      videoLink: "",
      needSafeArea: false,
      safeArea: null,
    });
    setBox(null);
    setNormalizedBox(null);
    setShowForm(false);
    setCurrentStep(1);
  };

  // Cancel form and reset state
  const cancelForm = () => {
    setFormData({
      cameraName: "",
      ip: "",
      videoLink: "",
      needSafeArea: false,
      safeArea: null,
    });
    setBox(null);
    setNormalizedBox(null);
    setShowForm(false);
    setCurrentStep(1);
  };

  // Safe area image click handler
  const handleImageClick = (e) => {
    // don't create if we're resizing
    if (isResizing) return;

    // only create when clicking the image itself, not the box or handles
    if (e.target !== imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const scaleX = imgRef.current.naturalWidth / rect.width;
    const scaleY = imgRef.current.naturalHeight / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setBox({
      x: x - 25,
      y: y - 25,
      width: 50,
      height: 50,
    });
  };

  // Start resizing safe area box
  const startResizing = (handle, e) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  // Handle mouse movement for resizing
  const handleMouseMove = (e) => {
    if (!isResizing || !box || !resizeHandle || !imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const scaleX = imgRef.current.naturalWidth / rect.width;
    const scaleY = imgRef.current.naturalHeight / rect.height;

    const deltaX = (e.clientX - startPos.x) * scaleX;
    const deltaY = (e.clientY - startPos.y) * scaleY;

    const newBox = { ...box };

    switch (resizeHandle) {
      case "e":
        newBox.width = Math.max(10, newBox.width + deltaX);
        break;
      case "s":
        newBox.height = Math.max(10, newBox.height + deltaY);
        break;
      case "se":
        newBox.width = Math.max(10, newBox.width + deltaX);
        newBox.height = Math.max(10, newBox.height + deltaY);
        break;
      case "sw":
        newBox.x = Math.max(0, newBox.x + deltaX);
        newBox.width = Math.max(10, newBox.width - deltaX);
        newBox.height = Math.max(10, newBox.height + deltaY);
        break;
      case "ne":
        newBox.y = Math.max(0, newBox.y + deltaY);
        newBox.width = Math.max(10, newBox.width + deltaX);
        newBox.height = Math.max(10, newBox.height - deltaY);
        break;
      case "nw":
        newBox.x = Math.max(0, newBox.x + deltaX);
        newBox.y = Math.max(0, newBox.y + deltaY);
        newBox.width = Math.max(10, newBox.width - deltaX);
        newBox.height = Math.max(10, newBox.height - deltaY);
        break;
      case "w":
        newBox.x = Math.max(0, newBox.x + deltaX);
        newBox.width = Math.max(10, newBox.width - deltaX);
        break;
      case "n":
        newBox.y = Math.max(0, newBox.y + deltaY);
        newBox.height = Math.max(10, newBox.height - deltaY);
        break;
    }

    // Keep within image bounds
    if (imgRef.current) {
      const maxX = imgRef.current.naturalWidth - newBox.width;
      const maxY = imgRef.current.naturalHeight - newBox.height;
      newBox.x = Math.min(Math.max(0, newBox.x), maxX);
      newBox.y = Math.min(Math.max(0, newBox.y), maxY);
    }

    setBox(newBox);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  // Stop resizing
  const stopResizing = () => {
    setIsResizing(false);
    setResizeHandle(null);
  };

  // Delete box
  const deleteBox = (e) => {
    e.stopPropagation();
    setBox(null);
    setNormalizedBox(null);
  };

  // Event listener setup for resizing
  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", stopResizing);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, box, resizeHandle, startPos]);

  // Delete camera handler
  const deleteCamera = async (id) => {
    try {
      const res = await fetch(`${API_LINK}/user/v1/admin/delete/camera/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        credentials: "include",
      });
      
      if (res.ok) {
        toast.success("Camera deleted successfully");
        setCameras(cameras.filter((camera) => camera.cameraId !== id));
      } else {
        toast.error("Failed to delete camera");
      }
    } catch (error) {
      console.error("Error deleting camera:", error);
      toast.error("Error deleting camera");
    }
  };

  const renderForm = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
              <h2 className="text-2xl font-bold text-white">Add New Camera</h2>
              <p className="text-purple-100 mt-1">Enter camera details below</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    htmlFor="cameraName"
                  >
                    Camera Name
                  </label>
                  <input
                    type="text"
                    id="cameraName"
                    name="cameraName"
                    value={formData.cameraName}
                    onChange={handleChange}
                    placeholder="e.g. Mobile Camera Redmi"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    htmlFor="ip"
                  >
                    IP Address
                  </label>
                  <input
                    type="text"
                    id="ip"
                    name="ip"
                    value={formData.ip}
                    onChange={handleChange}
                    placeholder="e.g. 192.168.1.7:4747"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    htmlFor="videoLink"
                  >
                    Video Stream URL
                  </label>
                  <input
                    type="url"
                    id="videoLink"
                    name="videoLink"
                    value={formData.videoLink}
                    onChange={handleChange}
                    placeholder="e.g. http://192.168.1.7:4747/video"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => {
                    cancelForm();
                    setShow(true);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition shadow-md flex items-center justify-center"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
              <h2 className="text-2xl font-bold text-white">
                Safe Area Selection
              </h2>
              <p className="text-purple-100 mt-1">
                Do you want to define a safe area?
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <input
                      id="safeAreaYes"
                      type="radio"
                      name="safeArea"
                      checked={formData.needSafeArea === true}
                      onChange={() => handleSafeAreaChoice("yes")}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <label
                      htmlFor="safeAreaYes"
                      className="ml-2 block text-sm font-medium text-gray-700"
                    >
                      Yes
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="safeAreaNo"
                      type="radio"
                      name="safeArea"
                      checked={formData.needSafeArea === false}
                      onChange={() => handleSafeAreaChoice("no")}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <label
                      htmlFor="safeAreaNo"
                      className="ml-2 block text-sm font-medium text-gray-700"
                    >
                      No
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition shadow-md flex items-center justify-center"
                >
                  {isLoading ? "Loading..." : "Next"}
                </button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
              <h2 className="text-2xl font-bold text-white">
                Define Safe Area
              </h2>
              <p className="text-purple-100 mt-1">
                Click and drag to define a safe area on the image
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="relative border-2 border-gray-300 cursor-crosshair">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64 bg-gray-100">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  </div>
                ) : (
                  <div onClick={handleImageClick}>
                    <img
                      ref={imgRef}
                      src={previewImage}
                      alt="Camera preview"
                      className="w-full h-auto"
                    />

                    {box && (
                      <div
                        className="absolute border-2 border-red-500 bg-red-500/20"
                        style={{
                          left: `${(box.x / imgRef.current?.naturalWidth || 1) * 100}%`,
                          top: `${(box.y / imgRef.current?.naturalHeight || 1) * 100}%`,
                          width: `${(box.width / imgRef.current?.naturalWidth || 1) * 100}%`,
                          height: `${(box.height / imgRef.current?.naturalHeight || 1) * 100}%`,
                        }}
                      >
                        <button
                          onClick={deleteBox}
                          className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 z-10"
                        >
                          ×
                        </button>

                        {["n", "s", "e", "w", "ne", "nw", "se", "sw"].map(
                          (handle) => (
                            <div
                              key={handle}
                              className="absolute bg-white border border-red-500"
                              style={{
                                width: "8px",
                                height: "8px",
                                ...handlePositions[handle],
                                cursor: `${handle}-resize`,
                              }}
                              onMouseDown={(e) => startResizing(handle, e)}
                            />
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Display normalized coordinates */}
              {normalizedBox && (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Normalized Coordinates (0-1 for OpenCV):</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">X:</span> {normalizedBox.x.toFixed(3)}
                    </div>
                    <div>
                      <span className="font-medium">Y:</span> {normalizedBox.y.toFixed(3)}
                    </div>
                    <div>
                      <span className="font-medium">Width:</span> {normalizedBox.width.toFixed(3)}
                    </div>
                    <div>
                      <span className="font-medium">Height:</span> {normalizedBox.height.toFixed(3)}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={refreshPreview}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center mr-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </button>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  disabled={isLoading}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition shadow-md flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    "Finish"
                  )}
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-[1450px] bg-gradient-to-br  from-indigo-50 to-purple-50 py-12">
      <div className="max-w-4xl mx-auto">
        {show && (
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800">
              Camera Management System
            </h1>
            <p className="text-gray-600 mt-2">
              Add and manage your surveillance cameras
            </p>
          </div>
        )}

        {!showForm ? (
          <div className="bg-white w-full rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Your Cameras
              </h2>
              <button
                onClick={() => {
                  setShowForm(true);
                  setShow(false);
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition shadow-md flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Camera
              </button>
            </div>

            {cameras.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cameras.map((camera) => (
                  <div
                    key={camera.cameraId}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Video className="h-5 w-5 text-blue-500" />
                        <h3 className="font-medium text-gray-800 truncate max-w-xs">
                          {camera.cameraName}
                        </h3>
                      </div>
                      <button
                        onClick={() => deleteCamera(camera.cameraId)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 -mr-1 opacity-0 group-hover:opacity-100"
                        aria-label="Delete camera"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Network className="h-4 w-4 text-gray-400" />
                        <span>IP: {camera.ip}</span>
                      </div>

                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <Link2 className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="truncate">
                          Video Link: {camera.videoLink}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>
                          Safe Area:{" "}
                          {camera.safeArea ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" /> Defined
                            </span>
                          ) : (
                            <span className="text-amber-600 flex items-center gap-1">
                              <XCircle className="h-4 w-4" /> Not defined
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <p className="mt-2 text-gray-500">No cameras added yet</p>
                <p className="text-sm text-gray-400">
                  Click the Add Camera button to get started
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-5xl mx-auto">{renderForm()}</div>
        )}
      </div>
    </div>
  );
}

const handlePositions = {
  n: { top: "-4px", left: "50%", transform: "translateX(-50%)" },
  s: { bottom: "-4px", left: "50%", transform: "translateX(-50%)" },
  e: { right: "-4px", top: "50%", transform: "translateY(-50%)" },
  w: { left: "-4px", top: "50%", transform: "translateY(-50%)" },
  ne: { right: "-4px", top: "-4px" },
  nw: { left: "-4px", top: "-4px" },
  se: { right: "-4px", bottom: "-4px" },
  sw: { left: "-4px", bottom: "-4px" },
};
