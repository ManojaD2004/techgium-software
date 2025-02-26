"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";

// ... (keep the same dummy data imports and constants)
const DUMMY_ROOMS = [
  {
    id: 1,
    name: "Conference Room A",
    cameras: 2,
    aiModel: "Smart Detect Pro",
    employees: 5,
  },
  {
    id: 2,
    name: "Lobby Security",
    cameras: 3,
    aiModel: "Motion Track V2",
    employees: 3,
  },
  {
    id: 3,
    name: "Warehouse Zone 1",
    cameras: 4,
    aiModel: "Object Recognition",
    employees: 7,
  },
  {
    id: 4,
    name: "Executive Suite",
    cameras: 1,
    aiModel: "Face ID Premium",
    employees: 2,
  },
  {
    id: 5,
    name: "Parking Entrance",
    cameras: 2,
    aiModel: "Vehicle Analyzer",
    employees: 4,
  },
];

const DUMMY_CAMERAS = [
  { id: 1, name: "CAM-101 (North Entrance)" },
  { id: 2, name: "CAM-102 (Lobby)" },
  { id: 3, name: "CAM-103 (Hallway A)" },
  { id: 4, name: "CAM-104 (Elevator)" },
  { id: 5, name: "CAM-105 (Parking A)" },
  { id: 6, name: "CAM-106 (Warehouse)" },
  { id: 7, name: "CAM-107 (Office Area)" },
];

const DUMMY_AI_MODELS = [
  {
    id: 1,
    name: "Smart Detect Pro",
    description: "All-purpose detection and tracking",
  },
  { id: 2, name: "Motion Track V2", description: "Advanced motion detection" },
  {
    id: 3,
    name: "Object Recognition",
    description: "Identifies common objects",
  },
  {
    id: 4,
    name: "Face ID Premium",
    description: "Facial recognition and identity matching",
  },
  {
    id: 5,
    name: "Vehicle Analyzer",
    description: "License plate and vehicle type detection",
  },
];

const DUMMY_EMPLOYEES = [
  { id: 1, name: "Sarah Johnson", role: "Security Manager" },
  { id: 2, name: "Michael Chen", role: "IT Specialist" },
  { id: 3, name: "Jessica Williams", role: "Operations Director" },
  { id: 4, name: "David Rodriguez", role: "Facilities Manager" },
  { id: 5, name: "Aisha Patel", role: "Security Analyst" },
  { id: 6, name: "Robert Kim", role: "Building Manager" },
  { id: 7, name: "Emily Nguyen", role: "Systems Administrator" },
  { id: 8, name: "James Wilson", role: "Security Guard" },
  { id: 9, name: "Olivia Garcia", role: "Front Desk" },
  { id: 10, name: "Thomas Lee", role: "Maintenance" },
];

const RoomManagement = () => {
  // ... (keep all the existing state and handler logic)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    roomName: "",
    selectedCameras: [],
    selectedAiModel: null,
    selectedEmployees: [],
  });

  // Handle room name input
  const handleRoomNameChange = (e) => {
    setFormData({
      ...formData,
      roomName: e.target.value,
    });
  };

  // Handle camera selection
  const handleCameraToggle = (cameraId) => {
    setFormData((prev) => {
      const newSelectedCameras = prev.selectedCameras.includes(cameraId)
        ? prev.selectedCameras.filter((id) => id !== cameraId)
        : [...prev.selectedCameras, cameraId];

      return {
        ...prev,
        selectedCameras: newSelectedCameras,
      };
    });
  };

  // Handle AI model selection
  const handleAiModelSelect = (modelId) => {
    setFormData({
      ...formData,
      selectedAiModel: modelId,
    });
  };

  // Handle employee selection
  const handleEmployeeToggle = (employeeId) => {
    setFormData((prev) => {
      const newSelectedEmployees = prev.selectedEmployees.includes(employeeId)
        ? prev.selectedEmployees.filter((id) => id !== employeeId)
        : [...prev.selectedEmployees, employeeId];

      return {
        ...prev,
        selectedEmployees: newSelectedEmployees,
      };
    });
  };

  // Filter employees based on search query
  const filteredEmployees = DUMMY_EMPLOYEES.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset form and close dialog
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

  // Handle form submission
  const handleCreateRoom = () => {
    // Here you would typically send data to your API
    console.log("Creating room with data:", formData);
    // Move to confirmation step
    setCurrentStep(4);
  };

  // Handle next step
  const handleNextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  // Handle back step
  const handleBackStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Check if current step is valid to proceed
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 w-[1100px] pl-5">
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
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-200 transition-all hover:shadow-xl px-8 py-6 h-auto rounded-xl"
          >
            <Plus className="mr-2 h-5 w-5" /> Create New Room
          </Button>
        </div>

        {/* Enhanced Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {DUMMY_ROOMS.map((room) => (
            <Card
              key={room.id}
              className="overflow-hidden transition-all duration-300 hover:shadow-xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl group"
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Video className="h-6 w-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {room.name}
                  </h2>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-slate-600">
                    <Brain className="h-5 w-5 mr-2 text-purple-600" />
                    <span className="text-sm font-medium">{room.aiModel}</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <Users className="h-5 w-5 mr-2 text-green-600" />
                    <span className="text-sm">{room.employees} authorized</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <Video className="h-5 w-5 mr-2 text-amber-600" />
                    <span className="text-sm">{room.cameras} cameras</span>
                  </div>
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

        {/* Enhanced Create Room Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md md:max-w-xl rounded-2xl bg-white max-h-[90%]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                {currentStep === 4
                  ? "Room Configuration Complete"
                  : "New Room Setup"}
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                {currentStep === 1 && "Start by naming your security zone"}
                {currentStep === 2 && "Configure surveillance devices"}
                {currentStep === 3 && "Manage personnel access"}
                {currentStep === 4 && "Your new security zone is operational"}
              </DialogDescription>
            </DialogHeader>

            {/* Progress Visualization */}
            {currentStep < 4 && (
              <div className="space-y-4">
                <Progress
                  value={((currentStep - 1) / 2) * 100}
                  className="h-2 bg-slate-100 [&>div]:bg-blue-600 transition-all duration-300"
                />
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Step {currentStep} of 3</span>
                  <span>
                    {currentStep === 1 && "Basic Information"}
                    {currentStep === 2 && "Device Configuration"}
                    {currentStep === 3 && "Access Management"}
                  </span>
                </div>
              </div>
            )}

            {/* Step Content */}
            <div className="py-2 space-y-2">
              {/* ... (keep existing step content but enhance styling) */}

              {/* Enhanced Step 1 */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Room Name
                    </Label>
                    <Input
                      placeholder="Security Zone Name"
                      value={formData.roomName}
                      onChange={handleRoomNameChange}
                      className="rounded-xl border-slate-200 py-6 text-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Enhanced Step 2 */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Camera Selection
                    </Label>
                    <div className="grid grid-cols-1 gap-3 h-28 overflow-y-scroll">
                      {DUMMY_CAMERAS.map((camera) => (
                        <div
                          key={camera.id}
                          className={`flex items-center p-2 rounded-xl border-2 transition-all cursor-pointer text-sm ${
                            formData.selectedCameras.includes(camera.id)
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 hover:border-blue-200"
                          }`}
                          onClick={() => handleCameraToggle(camera.id)}
                        >
                          <Checkbox
                            checked={formData.selectedCameras.includes(
                              camera.id
                            )}
                            className="h-3 w-3 rounded-lg border-2 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                          />
                          <span className="ml-3 font-medium text-sm text-slate-700">
                            {camera.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-slate-700">
                      AI Model Selection
                    </Label>
                    <div className="grid grid-cols-1 gap-3 h-36 overflow-y-scroll">
                      {DUMMY_AI_MODELS.map((model) => (
                        <div
                          key={model.id}
                          className={`p-2 rounded-xl border-2 transition-all cursor-pointer ${
                            formData.selectedAiModel === model.id
                              ? "border-purple-500 bg-purple-50"
                              : "border-slate-200 hover:border-purple-200"
                          }`}
                          onClick={() => handleAiModelSelect(model.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-6 w-6 rounded-full flex items-center justify-center ${
                                formData.selectedAiModel === model.id
                                  ? "bg-purple-600 text-white"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {formData.selectedAiModel === model.id && (
                                <CheckCircle className="h-3 w-3" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-slate-800 text-sm">
                                {model.name}
                              </h4>
                              <p className="text-sm text-slate-500 ">
                                {model.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Step 3 */}
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

                  <div className="space-y-4">
                    {filteredEmployees.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        No matching employees found
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto pr-3">
                        {filteredEmployees.map((employee) => (
                          <div
                            key={employee.id}
                            className={`flex items-center p-2 rounded-lg transition-all ${
                              formData.selectedEmployees.includes(employee.id)
                                ? "bg-green-50 border-2 border-green-500"
                                : "bg-slate-50 hover:bg-slate-100"
                            }`}
                          >
                            <Checkbox
                              checked={formData.selectedEmployees.includes(
                                employee.id
                              )}
                              onCheckedChange={() =>
                                handleEmployeeToggle(employee.id)
                              }
                              className="h-3 w-3 rounded-lg border-2 data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600"
                            />
                            <div className="ml-3 text-sm">
                              <h4 className="font-medium text-slate-800">
                                {employee.name}
                              </h4>
                              <p className="text-sm text-slate-500">
                                {employee.role}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {formData.selectedEmployees.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-sm font-medium mb-2">Selected Employees:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.selectedEmployees.map((empId) => {
                      const employee = DUMMY_EMPLOYEES.find((e) => e.id === empId);
                      return (
                        <Badge key={empId} variant="secondary" className="px-2 py-1">
                          {employee?.name}
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
              

              {/* Enhanced Confirmation Step */}
              {currentStep === 4 && (
                <div className="py-8 text-center space-y-6">
                  <div className="mx-auto w-24 h-24 rounded-full bg-green-100 flex items-center justify-center animate-in fade-in">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">
                    Configuration Complete!
                  </h3>
                  <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                    <span className="font-semibold text-blue-600">
                      {formData.roomName}
                    </span>{" "}
                    is now secured with {formData.selectedCameras.length}{" "}
                    cameras and {formData.selectedEmployees.length} authorized
                    personnel using the{" "}
                    {
                      DUMMY_AI_MODELS.find(
                        (m) => m.id === formData.selectedAiModel
                      )?.name
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