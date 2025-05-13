"use client";
import { useState, useRef, useEffect } from "react";
import API_LINK from "@/app/backendLink/link";
import toast from "react-hot-toast";

export default function CameraManagement() {
  const [cameras, setCameras] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
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
        });
    } catch (err) {
      console.log(err);
    }
  }, []);

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
  const refreshPreview = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_LINK}/cameras/preview/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoLink: formData.videoLink }),
      });
      if (!res.ok) {
        toast.error("Refresh failed");
      }
      const { previewUrl } = await res.json();
      setPreviewImage(previewUrl);
    } catch (e) {
      console.error(e);
      alert("Failed to refresh preview");
    } finally {
      setIsLoading(false);
    }
  };

  const finalizeCameraAddition = async () => {
    const newCamera = {
      id: Date.now(),
      cameraName: formData.cameraName,
      ip: formData.ip,
      videoLink: formData.videoLink,
      safeArea: formData.needSafeArea ? box : null,
    };

    
    if (formData.needSafeArea && box) {
      setIsLoading(true);
      try {
        const payload = {
          cameraName: formData.cameraName,
          ip: formData.ip,
          videoLink: formData.videoLink,
          safeArea: box,
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
        }
      } catch (error) {
        console.error("Error saving camera:", error);
        alert("Failed to save camera data");
        return;
      }
    }


    console.log("Added camera:", newCamera);

  
    setFormData({
      cameraName: "",
      ip: "",
      videoLink: "",
      needSafeArea: false,
      safeArea: null,
    });
    setBox(null);
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
    setShowForm(false);
    setCurrentStep(1);
  };

  // Safe area image click handler
  const handleImageClick = (e) => {
    // don't create if we're resizing
    if (isResizing) return;
    // only create if there's no box yet or replace existing

    // only create when clicking the image itself, not the box or handles
    if (e.target !== imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const scaleX = imgRef.current.width / rect.width;
    const scaleY = imgRef.current.height / rect.height;

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
    const scaleX = imgRef.current.width / rect.width;
    const scaleY = imgRef.current.height / rect.height;

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
      const maxX = imgRef.current.width - newBox.width;
      const maxY = imgRef.current.height - newBox.height;
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
  const deleteCamera = (id) => {
    setCameras(cameras.filter((camera) => camera.id !== id));
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
                  onClick={cancelForm}
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
                          left: `${box.x}px`,
                          top: `${box.y}px`,
                          width: `${box.width}px`,
                          height: `${box.height}px`,
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
                              className={`absolute bg-white border border-red-500`}
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
    <div className="min-h-screen bg-gradient-to-br w-screen from-indigo-50 to-purple-50 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">
            Camera Management System
          </h1>
          <p className="text-gray-600 mt-2">
            Add and manage your surveillance cameras
          </p>
        </div>

        {!showForm ? (
          <div className="bg-white w-full rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Your Cameras
              </h2>
              <button
                onClick={() => setShowForm(true)}
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
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex justify-between">
                      <h3 className="font-medium text-gray-800">
                        {camera.cameraName}
                      </h3>
                      <button
                        onClick={() => deleteCamera(camera.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      IP: {camera.ip}
                    </p>
                    <p className="text-sm text-gray-600">
                      Video Link: {camera.videoLink}
                    </p>
                    <p className="text-sm text-gray-600">
                      Safe Area: {camera.safeArea ? "Defined" : "Not defined"}
                    </p>
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
          <div className="w-full max-w-lg mx-auto">{renderForm()}</div>
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
