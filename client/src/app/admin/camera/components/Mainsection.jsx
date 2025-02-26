"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Eye, RefreshCw, Play, Square, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import API_LINK from '@/app/backendLink/link';

const CameraDashboard = () => {
  const [cameraData, setCameraData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRooms, setExpandedRooms] = useState({});
  const router = useRouter();

  const fetchCameras = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_LINK}/user/v1/track/get`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      }); 
      const responseData = await response.json();

      if (responseData.status === "success") {
        setCameraData(responseData.data);
        
        // Initialize expanded state for all rooms
        if (responseData.data.cameras && responseData.data.cameras.length > 0) {
          const rooms = {};
          responseData.data.cameras.forEach(camera => {
            if (camera.roomName) {
              rooms[camera.roomName] = true; // Default to expanded
            }
          });
          setExpandedRooms(rooms);
        }
        
        setLoading(false);
      } else {
        setError("Failed to fetch camera data");
        setLoading(false);
      }
    } catch (err) {
      setError("An error occurred while fetching cameras");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  const startTracking = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_LINK}/user/v1/track/start`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        credentials: "include"
      });
      
      if (response.ok) {
        toast.success("Tracking Started", {
          description: "Camera tracking has been initiated successfully."
        });
        
        // Refetch cameras after starting tracking
        fetchCameras();
      } else {
        setError("Failed to start tracking");
        setLoading(false);
        toast.error("Failed to start tracking", {
          description: "Please try again or check the server status."
        });
      }
    } catch (err) {
      setError("An error occurred while starting tracking");
      setLoading(false);
      toast.error("Connection Error", {
        description: "Could not connect to the tracking server."
      });
    }
  };

  const stopTracking = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_LINK}/user/v1/track/stop`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        credentials: "include"
      });
      
      if (response.ok) {
        toast.success("Tracking Stopped", {
          description: "Camera tracking has been stopped successfully."
        });
        
        window.location.reload();
      } else {
        setError("Failed to stop tracking");
        setLoading(false);
        toast.error("Failed to stop tracking", {
          description: "Please try again or check the server status."
        });
      }
    } catch (err) {
      setError("An error occurred while stopping tracking");
      setLoading(false);
      toast.error("Connection Error", {
        description: "Could not connect to the tracking server."
      });
    }
  };

  const handleCameraClick = (cameraId) => {
    router.push(`/camera/${cameraId}`);
  };

  const toggleRoomExpand = (roomName, e) => {
    e.stopPropagation(); // Prevent triggering camera click
    setExpandedRooms(prev => ({
      ...prev,
      [roomName]: !prev[roomName]
    }));
  };

  // Group cameras by room
  const groupCamerasByRoom = () => {
    if (!cameraData?.cameras || cameraData.cameras.length === 0) return {};
    
    return cameraData.cameras.reduce((acc, camera) => {
      const roomName = camera.roomName || "Unassigned";
      if (!acc[roomName]) {
        acc[roomName] = [];
      }
      acc[roomName].push(camera);
      return acc;
    }, {});
  };

  const hasCameras = cameraData?.cameras && cameraData.cameras.length > 0;
  const camerasByRoom = groupCamerasByRoom();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6 w-[1150px]">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Security Camera Dashboard</h1>
          <div className="flex gap-4">
            {hasCameras && (
              <Button 
                variant="destructive" 
                className="flex items-center gap-2"
                onClick={stopTracking}
              >
                <Square className="h-4 w-4" />
                Stop Tracking
              </Button>
            )}
            <Button 
              variant="outline" 
              className="flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-700"
              onClick={fetchCameras}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 p-4 rounded-lg">
            {error}
          </div>
        ) : !hasCameras ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 text-yellow-500 p-4 rounded-lg mb-4 w-full max-w-md text-center">
              No cameras are currently active.
            </div>
            <Button 
              size="lg" 
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={startTracking}
            >
              <Play className="h-5 w-5" />
              Start Camera Tracking
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(camerasByRoom).map(([roomName, cameras]) => (
              <div key={roomName} className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                <div 
                  className="bg-slate-700 p-4 flex justify-between items-center cursor-pointer"
                  onClick={(e) => toggleRoomExpand(roomName, e)}
                >
                  <h2 className="text-xl font-medium text-white flex items-center gap-2">
                    <Camera className="h-5 w-5 text-blue-400" />
                    {roomName} ({cameras.length})
                  </h2>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-slate-300 hover:text-white hover:bg-slate-600"
                    onClick={(e) => toggleRoomExpand(roomName, e)}
                  >
                    {expandedRooms[roomName] ? 
                      <ChevronUp className="h-5 w-5" /> : 
                      <ChevronDown className="h-5 w-5" />
                    }
                  </Button>
                </div>
                
                {expandedRooms[roomName] && (
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {cameras.map((camera) => (
                        <Card 
                          key={camera.cameraId}
                          className="overflow-hidden bg-slate-800 border-slate-700 hover:border-blue-500 transition-all duration-300 cursor-pointer group"
                          onClick={() => handleCameraClick(camera.cameraId)}
                        >
                          <CardHeader className="bg-slate-700 p-4 pb-2">
                            <CardTitle className="text-lg text-white flex items-center gap-2">
                              <Camera className="h-5 w-5 text-blue-400" />
                              {camera.cameraName}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-0 relative">
                            <div className="aspect-video bg-slate-900 flex items-center justify-center">
                              <img 
                                src={`${API_LINK}:${camera.port}/video_feed`}
                                alt="Camera Feed"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "/static-placeholder.svg";
                                }}
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 group-hover:bg-opacity-10 transition-all">
                                <div className="bg-blue-500 rounded-full p-3 shadow-lg transform group-hover:scale-110 transition-transform">
                                  <Eye className="h-6 w-6 text-white" />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="p-4 flex-col bg-slate-800 gap-2">
                            <div className="flex justify-between items-center w-full">
                              <div className="text-sm text-slate-300">
                                IP: {camera.ip.split('//')[1]}
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-900 hover:bg-opacity-20"
                              >
                                View
                              </Button>
                            </div>
                            
                            
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraDashboard;