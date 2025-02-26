"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Eye, RefreshCw, Play, Square } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const CameraDashboard = () => {
  const [cameraData, setCameraData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Fetch camera data function with real API call
  const fetchCameras = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cameras'); 
      const responseData = await response.json();

      if (responseData.status === "success") {
        setCameraData(responseData.data);
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

  // Start tracking function
  const startTracking = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:9000/user/v1/track/start', {
        method: 'POST',
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

  // Stop tracking function
  const stopTracking = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:9000/user/v1/track/stop', {
        method: 'POST',
      });
      
      if (response.ok) {
        toast.success("Tracking Stopped", {
          description: "Camera tracking has been stopped successfully."
        });
        
        // Reload the page after stopping tracking
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

  // Handle camera card click to redirect
  const handleCameraClick = (cameraId) => {
    router.push(`/camera/${cameraId}`);
  };

  const hasCameras = cameraData?.cameras && cameraData.cameras.length > 0;

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cameraData.cameras.map((camera) => (
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
                      src={`http://127.0.0.1:${camera.port}/video_feed`}
                      alt="Camera Feed"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/api/placeholder/640/360";
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
                      Room: {camera.roomName || "Unassigned"}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-900 hover:bg-opacity-20"
                    >
                      View
                    </Button>
                  </div>
                  
                  {camera.emps && camera.emps.length > 0 && (
                    <div className="w-full mt-2 pt-2 border-t border-slate-700">
                      <p className="text-xs text-slate-400 mb-2">Employees Detected:</p>
                      <div className="flex flex-wrap gap-2">
                        {camera.emps.map((emp) => (
                          <div key={emp.id} className="flex items-center gap-2 bg-slate-700 p-1 px-2 rounded-full">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-600">
                              <img 
                                src={emp.imgURL} 
                                alt={emp.firstName} 
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "/api/placeholder/40/40";
                                }}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-xs text-white">{emp.firstName} {emp.lastName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraDashboard;