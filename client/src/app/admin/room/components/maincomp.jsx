"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  Plus,
  Search,
  ArrowRight,
  Video,
  Brain,
  Users,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-hot-toast";
import API_LINK from "@/app/backendLink/link";

const API_URL = API_LINK;



const RoomManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [rooms, setRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [aiModels, setAiModels] = useState([]);
  const [isLoadingAiModels, setIsLoadingAiModels] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [cameras, setCameras] = useState([]);

  const [formData, setFormData] = useState({
    roomName: "",
    selectedCameras: [],
    selectedAiModel: null,
    selectedEmployees: [],
  });

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch(`${API_URL}/user/v1/admin/get/rooms`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        });
        if (!response.ok) {
          toast.error("Failed to fetch rooms");
        }

        const data = await response.json();
        setRooms(data.data.rooms);
        console.log(data);
        

      } catch (error) {
        toast.error("Failed to load rooms");
      } finally {
        setIsLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    const fetchAiModels = async () => {
      if (currentStep === 2 && !aiModels.length) {
        setIsLoadingAiModels(true);
        try {
          const response = await fetch(`${API_URL}/user/v1/admin/get/models`, {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
          });
          if (!response.ok) {
            toast.error("Failed to fetch AI models");
          }

          const data = await response.json();
          setAiModels(data.data.models);
        } catch (error) {
          toast.error("Failed to load AI models");
        } finally {
          setIsLoadingAiModels(false);
        }
      }
    };
    fetchAiModels();
  }, [currentStep]);

  useEffect(() => {
    const fetchCameras = async () => {
      if (currentStep === 2 && !cameras.length) {
        try {
          const response = await fetch(
            `${API_URL}/user/v1/admin/get/cameras`,{
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                  "ngrok-skip-browser-warning": "true",
                },
            }
          );
          const data = await response.json();
          console.log(data);
          

          if (data.status === "success" && data.data?.cameras) {
            setCameras(data.data.cameras);
          }
        } catch (error) {
          console.error("Error fetching cameras:", error);
        }
      }
    };

    fetchCameras();
  }, [currentStep]);

  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoadingEmployees(true);
      try {
        const response = await fetch(`${API_URL}/user/v1/admin/get/employees`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        });
        if (!response.ok) {
          toast.error("Failed to fetch employees");
        }

        const data = await response.json();
        setEmployees(data.data.employees);
      } catch (error) {
        toast.error("Failed to load employees");
      } finally {
        setIsLoadingEmployees(false);
      }
    };

    if (currentStep === 3) {
      const debounceTimer = setTimeout(fetchEmployees, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [searchQuery, currentStep]);

  const handleRoomNameChange = (e) => {
    setFormData({ ...formData, roomName: e.target.value });
  };

  const handleCameraToggle = (cameraId) => {
    setFormData((prev) => ({
      ...prev,
      selectedCameras: prev.selectedCameras.includes(cameraId)
        ? prev.selectedCameras.filter((id) => id !== cameraId)
        : [...prev.selectedCameras, cameraId],
    }));
  };
  const handleCreateRoom = async () => {
    console.log(formData);

    try {
      const response = await fetch(`${API_URL}/user/v1/admin/create/room`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          roomName: formData.roomName,
          cameras: formData.selectedCameras,
          modelId: formData.selectedAiModel,
          employees: formData.selectedEmployees,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to create room");
        return
      }

      const newRoom = await response.json();
      setCurrentStep(4);
      toast.success("Room created successfully!");

    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAiModelSelect = (modelId) => {
    setFormData({ ...formData, selectedAiModel: modelId });
  };

  const handleEmployeeToggle = (employeeId) => {
    setFormData((prev) => ({
      ...prev,
      selectedEmployees: prev.selectedEmployees.includes(employeeId)
        ? prev.selectedEmployees.filter((id) => id !== employeeId)
        : [...prev.selectedEmployees, employeeId],
    }));
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentStep(1);
    setFormData({
      roomName: "",
      selectedCameras: [],
      selectedAiModel: null,
      selectedEmployees: [],
    });
    setSearchQuery("");
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.roomName.trim().length > 0;
      case 2:
        return formData.selectedCameras.length > 0 && formData.selectedAiModel;
      case 3:
        return formData.selectedEmployees.length > 0;
      default:
        return true;
    }
  };
  const handleNextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  const handleBackStep = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 w-[1100px]">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              Room Management
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              Manage security configurations and access controls
            </p>
          </div>

          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-200 transition-all hover:shadow-xl px-8 py-6 h-auto rounded-xl"
          >
            <Plus className="mr-2 h-5 w-5" /> Create New Room
          </Button>
        </div>

        {/* Rooms Grid */}
        {isLoadingRooms ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : rooms?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room) => (
              <Card
                key={room.roomId}
                className="overflow-hidden transition-all duration-300 hover:shadow-xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl group"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Video className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">
                      {room.roomName}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-slate-600">
                      <Brain className="h-5 w-5 mr-2 text-purple-600" />
                      <span className="text-sm font-medium">
                        {room.modelName}
                      </span>
                    </div>
                    <div className="flex items-center text-slate-600">
                      <Video className="h-5 w-5 mr-2 text-amber-600" />
                      <span className="text-sm">{room.userName} </span>
                    </div>

                    {/* <div className="flex items-center text-slate-600">
                      <Video className="h-5 w-5 mr-2 text-amber-600" />
                      <span className="text-sm">{room.cameras} cameras</span>
                    </div> */}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                    <Button
                      variant="outline"
                      className="rounded-lg border-slate-200 hover:bg-blue-50 hover:border-blue-200"
                    >
                      Manage Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg">
              <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-slate-800 mb-2">
                No Security Zones Found
              </h3>
              <p className="text-slate-600 max-w-md mb-6">
                Create your first security zone to start monitoring and managing
                access controls for different areas.
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="mr-2 h-5 w-5" /> Create First Zone
              </Button>
            </div>
          </div>
        )}

        {/* Create Room Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md md:max-w-xl rounded-2xl bg-white max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                {currentStep === 4
                  ? "Configuration Complete"
                  : "New Security Zone"}
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                {currentStep === 1 && "Define your security zone parameters"}
                {currentStep === 2 && "Configure surveillance devices"}
                {currentStep === 3 && "Manage authorized personnel"}
                {currentStep === 4 && "Zone is ready for monitoring"}
              </DialogDescription>
            </DialogHeader>

            {currentStep < 4 && (
              <div className="space-y-4">
                <Progress
                  value={((currentStep - 1) / 2) * 100}
                  className="h-2 bg-slate-100 [&>div]:bg-blue-600 transition-all duration-300"
                />
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Step {currentStep} of 3</span>
                  <span>
                    {currentStep === 1 && "Basic Configuration"}
                    {currentStep === 2 && "Device Setup"}
                    {currentStep === 3 && "Access Management"}
                  </span>
                </div>
              </div>
            )}

            <div className="py-4 space-y-6 overflow-y-auto">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Zone Name
                    </Label>
                    <Input
                      placeholder="Enter security zone name"
                      value={formData.roomName}
                      onChange={handleRoomNameChange}
                      className="rounded-xl border-slate-200 py-6 text-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Device Setup */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Camera Selection
                    </Label>
                    <div className="grid grid-cols-1 gap-3 h-28 overflow-y-scroll">
                      {cameras.map((camera) => (
                        <div
                          key={camera.cameraId}
                          className={`flex items-center px-2 rounded-xl border-2 h-[50%] transition-all cursor-pointer text-sm py-4 ${
                            formData.selectedCameras.includes(camera.cameraId)
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 hover:border-blue-200"
                          }`}
                          onClick={() => handleCameraToggle(camera.cameraId)}
                        >
                          <Checkbox
                            checked={formData.selectedCameras.includes(
                              camera.cameraId
                            )}
                            className="h-3 w-3 rounded-lg border-2 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                          />
                          <span className="ml-3  font-medium text-sm text-slate-700">
                            {camera.cameraName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-slate-700">
                      AI Model Selection
                    </Label>
                    {isLoadingAiModels ? (
                      <div className="flex flex-col gap-3">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-6 rounded-xl" />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {aiModels.map((model) => (
                          <div
                            key={model.modelId}
                            className={`p-2 rounded-xl border-2 transition-all cursor-pointer ${
                              formData.selectedAiModel === model.modelId
                                ? "border-purple-500 bg-purple-50"
                                : "border-slate-200 hover:border-purple-200"
                            }`}
                            onClick={() => handleAiModelSelect(model.modelId)}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`h-6 w-6 rounded-full flex items-center justify-center ${
                                  formData.selectedAiModel === model.modelId
                                    ? "bg-purple-600 text-white"
                                    : "bg-slate-100 text-slate-400"
                                }`}
                              >
                                {formData.selectedAiModel === model.modelId && (
                                  <CheckCircle className="h-3 w-3" />
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium text-sm text-slate-800">
                                  {model.modelName}
                                </h4>
                                <p className="text-sm text-slate-500">
                                  {model.createdAt}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Access Management */}
              {currentStep === 3 && (
                <div className="space-y-1">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Authorized Personnel
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                      <Input
                        placeholder="Search employees..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 py-6 rounded-xl border-slate-200 text-lg"
                      />
                    </div>
                  </div>

                  {isLoadingEmployees ? (
                    <div className="flex flex-col gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-14 rounded-lg" />
                      ))}
                    </div>
                  ) : employees.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto pr-3">
                      {employees.map((employee) => (
                        <div
                          key={employee.id}
                          className={`flex items-center p-2 rounded-lg transition-all ${
                            formData.selectedEmployees.includes(employee.id)
                              ? "bg-green-50 border-2 border-green-500"
                              : "bg-slate-50 hover:bg-slate-100"
                          }`}
                          onClick={() => handleEmployeeToggle(employee.id)}
                        >
                          <Checkbox
                            checked={formData.selectedEmployees.includes(
                              employee.id
                            )}
                            className="h-3 w-3 rounded-lg border-2 data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600"
                          />
                          <div className="ml-3">
                            <h4 className="font-medium text-sm text-slate-800">
                              {employee.firstName}
                            </h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      No employees found matching your search
                    </div>
                  )}
                  {formData.selectedEmployees.length > 0 && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-sm font-medium mb-2">
                        Selected Employees:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {formData.selectedEmployees.map((empId) => {
                          const employee = employees.find(
                            (e) => e.id === empId
                          );
                          return (
                            <Badge
                              key={empId}
                              variant="secondary"
                              className="px-2 py-1"
                            >
                              {employee?.firstName}
                              <button
                                className="ml-1 text-gray-500 hover:text-gray-700"
                                onClick={() => handleEmployeeToggle(empId)}
                              >
                                ×
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === 4 && (
                <div className="py-8 text-center space-y-6">
                  <div className="mx-auto w-24 h-24 rounded-full bg-green-100 flex items-center justify-center animate-in fade-in">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">
                    Security Zone Active!
                  </h3>
                  <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                    <span className="font-semibold text-blue-600">
                      {formData.roomName}
                    </span>{" "}
                    is now monitored with {formData.selectedCameras.length}{" "}
                    cameras and {formData.selectedEmployees.length} authorized
                    personnel using the{" "}
                    {
                      aiModels.find((m) => m.id === formData.selectedAiModel)
                        ?.name
                    }{" "}
                    AI model.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="flex justify-between gap-4">
              {currentStep < 4 ? (
                <>
                  <Button
                    variant="outline"
                    onClick={
                      currentStep === 1 ? handleCloseDialog : handleBackStep
                    }
                    className="rounded-xl px-6 py-5 border-slate-200 hover:bg-slate-100"
                  >
                    {currentStep === 1 ? "Cancel" : "Back"}
                  </Button>
                  <Button
                    disabled={!isStepValid()}
                    onClick={
                      currentStep === 3 ? handleCreateRoom : handleNextStep
                    }
                    className={`rounded-xl px-8 py-5 text-white text-sm ${
                      isStepValid()
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        : "bg-slate-300 cursor-not-allowed"
                    }`}
                  >
                    {currentStep === 3 ? "Finalize Setup" : "Continue"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleCloseDialog}
                  className="w-full text-white rounded-xl py-6 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  Return to Dashboard
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default RoomManagement;
