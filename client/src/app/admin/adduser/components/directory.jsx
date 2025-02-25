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

const API_URL = "https://profound-adequate-salmon.ngrok-free.app";

const fetchEmployees = async (query = "") => {
  try {
    const response = await fetch(
      `${API_URL}/employees?query=${encodeURIComponent(query)}`
    );
    if (!response.ok) toast.error("Failed to fetch employees");
    return await response.json();
  } catch (error) {
    console.error("Error fetching employees:", error);
    toast.error("Failed to load employees");
    return [];
  }
};

const addEmployee = async (formData) => {
  try {
    const response = await fetch(`${API_URL}/employees`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      toast.error(errorData.message || "Failed to add employee");
    }

    return await response.json();
  } catch (error) {
    console.error("Error adding employee:", error);
  }
};

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSearchQuery, setTempSearchQuery] = useState("");
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    role: "",
    photoFile: null,
  });
  const [previewUrl, setPreviewUrl] = useState("");
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

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!isDialogOpen) {
      setNewEmployee({ name: "", role: "", photoFile: null });
      setPreviewUrl("");
    }
  }, [isDialogOpen]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchQuery(tempSearchQuery);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setNewEmployee((prev) => ({ ...prev, photoFile: file }));
  };

  const triggerFileInput = () => fileInputRef.current.click();

  const clearFileSelection = () => {
    URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setNewEmployee((prev) => ({ ...prev, photoFile: null }));
    fileInputRef.current.value = "";
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", newEmployee.name);
    formData.append("role", newEmployee.role);
    if (newEmployee.photoFile) {
      formData.append("photo", newEmployee.photoFile);
    }

    try {
      setIsLoading(true);
      const addedEmployee = await addEmployee(formData);
      setEmployees((prev) => [...prev, addedEmployee]);
      setIsDialogOpen(false);
      toast.success("Employee added successfully");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 min-w-[1100px]">
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
              <form onSubmit={handleAddEmployee} className="space-y-6 py-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newEmployee.name}
                    onChange={(e) =>
                      setNewEmployee((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Enter employee name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={newEmployee.role}
                    onChange={(e) =>
                      setNewEmployee((prev) => ({
                        ...prev,
                        role: e.target.value,
                      }))
                    }
                    placeholder="Enter employee role"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Photo</Label>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {!previewUrl ? (
                    <div
                      onClick={triggerFileInput}
                      className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                    >
                      <Camera className="h-10 w-10 text-slate-400" />
                      <p className="text-sm text-slate-500">
                        Click to upload a photo
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative w-full pt-[100%] rounded-xl overflow-hidden">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={clearFileSelection}
                        className="absolute top-2 right-2 rounded-full p-1 bg-white/80 text-slate-700 hover:bg-white shadow-md"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-to-r text-white from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 w-full rounded-lg py-2 h-auto text-base"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin h-6 w-6" />
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
                      {employee.photoUrl ? (
                        <img
                          src={employee.photoUrl}
                          alt={`${employee.name}'s photo`}
                          className="w-full h-full object-cover rounded-full ring-4 ring-indigo-100"
                        />
                      ) : (
                        <Avatar
                          className={`w-full h-full ${getAvatarColor(
                            employee.name
                          )}`}
                        >
                          <AvatarFallback className="text-2xl font-semibold">
                            {getInitials(employee.name)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-400 rounded-full border-4 border-white"></div>
                    </div>

                    <div>
                      <h3 className="font-bold text-xl text-slate-800">
                        {employee.name}
                      </h3>
                      {employee.role && (
                        <p className="text-slate-500 mt-1">{employee.role}</p>
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
