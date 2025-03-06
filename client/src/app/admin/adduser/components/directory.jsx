"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../../components/ui/avatar";
import { Card, CardContent } from "../../../../components/ui/card";
import { Search, Plus, User, Camera, Loader2, X } from "lucide-react";
import { toast } from "react-hot-toast";
import API_LINK from "@/app/backendLink/link";

const API_URL = API_LINK;

const fetchEmployees = async (query = "") => {
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
      return;
    }

    const data = await response.json();

    console.log(data);
    return data.data.employees;
  } catch (error) {
    toast.error("Failed to load employees");
    return [];
  }
};

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSearchQuery, setTempSearchQuery] = useState("");
  const [newEmployee, setNewEmployee] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    password: "",
    photoFiles: [],
  });
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadEmployees = async () => {
      setIsLoading(true);
      try {
        const data = await fetchEmployees(searchQuery);

        setEmployees(data);
      } finally {
        setIsLoading(false);
      }
    };

    loadEmployees();
  }, [searchQuery]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchQuery(tempSearchQuery);
  };


  useEffect(() => {
    // Cleanup preview URLs when component unmounts
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);
  
  useEffect(() => {
    if (!isDialogOpen) {
      // Reset form state when dialog closes
      setNewEmployee({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        password: "",
        photoFiles: [], // Changed from photoFile to photoFiles
      });
  
      // Cleanup all preview URLs
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setPreviewUrls([]); // Changed from setPreviewUrl to setPreviewUrls
    }
  }, [isDialogOpen]);


  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Create preview URLs
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...urls]);
    
    // Store files in state
    setNewEmployee(prev => ({
      ...prev,
      photoFiles: [...prev.photoFiles, ...files]
    }));
  };

  const removeFile = (index) => {
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setNewEmployee(prev => ({
      ...prev,
      photoFiles: prev.photoFiles.filter((_, i) => i !== index)
    }));
    URL.revokeObjectURL(previewUrls[index]);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleAddEmployee = async (e) => {
  e.preventDefault();
  const userData = JSON.stringify({
    firstName: newEmployee.firstName,
    lastName: newEmployee.lastName,
    password: newEmployee.password,
    phoneNumber: newEmployee.phoneNumber,
  });
  
  // Create FormData and append JSON user data as a Blob
  const formData = new FormData();
  formData.append("userData", new Blob([userData], { type: "application/json" }));
  
  // Convert image files to ArrayBuffer and store as Blob
  await Promise.all(
    newEmployee.photoFiles.map(async (file, index) => {
      const arrayBuffer = await file.arrayBuffer(); // Convert file to ArrayBuffer
      const blob = new Blob([arrayBuffer], { type: file.type }); // Convert ArrayBuffer to Blob
      formData.append("files", blob, file.name); // Append Blob to FormData
    })
  );
  
  

  try {
    setIsLoading(true);
    const response = await fetch(`${API_URL}/user/v1/create/employee`, {
      method: "POST",
      body: formData,
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      toast.error(errorData.message || "Failed to add employee");
    }

    const data = await response.json();
    toast.success("Employee added successfully!");
    setIsDialogOpen(false);
    
    // Reset form
    setNewEmployee({
      firstName: "",
      lastName: "",
      phoneNumber: "",
      password: "",
      photoFiles: []
    });
    setPreviewUrls([]);

  } catch (error) {
    toast.error(error.message || "Failed to add employee");
  } finally {
    setIsLoading(false);
  }
};



  const getInitials = (name) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = [
      "bg-blue-100 text-blue-600",
      "bg-purple-100 text-purple-600",
      "bg-pink-100 text-pink-600",
      "bg-amber-100 text-amber-600",
      "bg-emerald-100 text-emerald-600",
      "bg-teal-100 text-teal-600",
      "bg-indigo-100 text-indigo-600",
      "bg-rose-100 text-rose-600",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 min-w-[1450px]">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600">
                Employee Directory
              </h1>
              <p className="text-slate-500 mt-2 text-lg">
                Manage your team members in one place
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl px-6 py-6 h-auto rounded-xl">
                  <Plus className="mr-2 h-5 w-5" /> Add Employee
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">
                    Add New Employee
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleAddEmployee} className="space-y-4 py-2">
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={newEmployee.firstName}
                          onChange={(e) =>
                            setNewEmployee((prev) => ({
                              ...prev,
                              firstName: e.target.value,
                            }))
                          }
                          placeholder="First name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={newEmployee.lastName}
                          onChange={(e) =>
                            setNewEmployee((prev) => ({
                              ...prev,
                              lastName: e.target.value,
                            }))
                          }
                          placeholder="Last name"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                          id="phoneNumber"
                          value={newEmployee.phoneNumber}
                          onChange={(e) =>
                            setNewEmployee((prev) => ({
                              ...prev,
                              phoneNumber: e.target.value,
                            }))
                          }
                          placeholder="Phone number"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newEmployee.password}
                          onChange={(e) =>
                            setNewEmployee((prev) => ({
                              ...prev,
                              password: e.target.value,
                            }))
                          }
                          placeholder="Password"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Photos</Label>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        multiple
                      />

                      {previewUrls.length === 0 ? (
                        <div
                          onClick={triggerFileInput}
                          className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                        >
                          <Camera className="h-10 w-10 text-gray-400" />
                          <p className="text-sm text-gray-500">
                            Click to upload photos (multiple allowed)
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-4">
                          {previewUrls.map((url, index) => (
                            <div key={url} className="relative aspect-square">
                              <img
                                src={url}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute top-1 right-1 bg-white/80 hover:bg-white rounded-full p-1 shadow-sm"
                              >
                                <X className="h-4 w-4 text-gray-700" />
                              </button>
                            </div>
                          ))}
                          {previewUrls.length > 0 && (
                            <div
                              onClick={triggerFileInput}
                              className="border-2 border-dashed border-gray-300 rounded-lg aspect-square flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50"
                            >
                              <Plus className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 w-full text-white rounded-lg py-2 h-auto text-base"
                    >
                      {isLoading ? (
                        <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                      ) : (
                        "Add Employee"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mb-12 max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="flex">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search employees by name or role..."
                  className="pl-12 py-6 rounded-l-xl border-slate-200 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-100 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-lg"
                  value={tempSearchQuery}
                  onChange={(e) => setTempSearchQuery(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all rounded-r-xl h-5 py-[24.5px]  shadow-lg shadow-indigo-200 px-6"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              </Button>
            </form>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64 ">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
                <p className="text-slate-500">Loading employees...</p>
              </div>
            </div>
          ) : employees.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {employees.map((employee) => (
                <Card
                  key={employee.id}
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm rounded-2xl"
                >
                  <CardContent className="p-0">
                    <div className="p-8 flex flex-col items-center text-center gap-3">
                      <div className="w-24 h-24 mb-2 relative">
                        {employee.imgURL ? (
                          <img
                            src={`${API_URL}${employee.imgURL}`}
                            alt={`${employee.firstName}'s photo`}
                            className="w-full h-full object-cover rounded-full ring-4 ring-indigo-100"
                            
                          />
                        ) : (
                          <Avatar
                            className={`w-full h-full ${getAvatarColor(
                              employee.firstName
                            )}`}
                          >
                            <AvatarFallback className="text-2xl font-semibold">
                              {getInitials(employee.firstName)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-400 rounded-full border-4 border-white"></div>
                      </div>

                      <div>
                        <h3 className="font-bold text-xl text-slate-800">
                          {employee.firstName} {employee.lastName}
                        </h3>
                        {employee.phoneNumber && (
                          <p className="text-slate-500 mt-1">
                            {employee.phoneNumber}
                          </p>
                        )}
                      </div>

                      <div className="mt-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          Active
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="flex flex-col items-center gap-4">
                <User className="h-16 w-16 text-slate-300" />
                <h3 className="text-xl font-medium text-slate-700">
                  No employees found
                </h3>
                <p className="text-slate-500">
                  Try a different search or add some employees.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
