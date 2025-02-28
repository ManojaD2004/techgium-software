import { useState, useEffect } from "react";
import { Bell, Users, AlertTriangle, UserCheck, UserX } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import API_LINK from "@/app/backendLink/link";
import toast from "react-hot-toast";

export default function Notification() {
  const formatTimestamp = (timestamp) => {
    return new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(timestamp));
  };
  const [logs,setLogs]=useState([]);
  const [rooms,setRooms]=useState([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_LINK}/user/v1/track/noti`,{
          credentials:"include",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },

        }); 
        const responseData = await response.json();
  
        if (responseData.status === "success") {
          setRooms(responseData.data.room);
          
          setLogs((prevLogs) => {
            
            const newLogs = responseData.data.noti.filter(
              (log) => !prevLogs.some((prev) => prev.id === log.id)
            );
            return [...newLogs, ...prevLogs]; 
          });
        }
      } catch (error) {
        toast.error("Error fetching data:", error);
      }
    };
  
    fetchData(); 
  
    const interval = setInterval(fetchData, 3000); 
  
    return () => clearInterval(interval); 
  }, []);
  


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto p-4">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Room Monitoring Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Live room occupancy tracking and security alerts
          </p>
        </header>

        {/* Room Occupancy Section - Always visible at top */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Room Occupancy
            </h2>
            <Badge variant="outline" className="gap-1">
              <Bell size={14} className="text-amber-500" />
              <span>
                {
                  logs.filter(
                    (log) => log.type === "alert" || log.type === "warning"
                  ).length
                }{" "}
                Active Alerts
              </span>
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {rooms.map((room) => (
              <Card
                key={room.id}
                className={`overflow-hidden ${
                  room.status === "exceeded"
                    ? "border-red-400 dark:border-red-600"
                    : ""
                }`}
              >
                <CardHeader
                  className={`pb-2 ${
                    room.status === "exceeded"
                      ? "bg-red-50 dark:bg-red-900/20"
                      : ""
                  }`}
                >
                  <CardTitle className="flex justify-between items-center">
                    <span>{room.name}</span>
                    {room.status === "exceeded" && (
                      <AlertTriangle size={18} className="text-red-500" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    Max Capacity: {room.maxCapacity}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users
                        size={20}
                        className={
                          room.status === "exceeded"
                            ? "text-red-500"
                            : "text-blue-500"
                        }
                      />
                      <span className="text-2xl font-bold">
                        {room.currentOccupancy}
                      </span>
                    </div>
                    <div className="flex items-center">
                      {room.status === "exceeded" ? (
                        <Badge variant="destructive" className="gap-1">
                          <UserX size={14} />
                          <span>Exceeded</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="gap-1 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800"
                        >
                          <UserCheck size={14} />
                          <span>Normal</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        room.status === "exceeded"
                          ? "bg-red-500"
                          : room.currentOccupancy / room.maxCapacity > 0.8
                          ? "bg-amber-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (room.currentOccupancy / room.maxCapacity) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* Notification Logs Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Notification Logs
            </h2>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Security & Occupancy Logs</CardTitle>
              <CardDescription>Real-time notification system</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {logs.map((log) => (
                    <Alert
                      key={log.id}
                      variant={
                        log.type === "alert"
                          ? "destructive"
                          : log.type === "warning"
                          ? "default"
                          : "outline"
                      }
                      className={`
                        ${
                          log.type === "alert"
                            ? "border-red-500 bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-300"
                            : ""
                        } 
                        ${
                          log.type === "warning"
                            ? "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-300"
                            : ""
                        }
                        ${
                          log.type === "info"
                            ? "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300"
                            : ""
                        }
                      `}
                    >
                      <div className="flex items-start">
                        {log.type === "alert" && (
                          <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                        )}
                        {log.type === "warning" && (
                          <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                        )}
                        {log.type === "info" && (
                          <Users className="h-4 w-4 mr-2 text-blue-500" />
                        )}
                        <div className="w-full">
                          <AlertTitle className="text-sm font-medium mb-1">
                            {log.type.toUpperCase()}
                          </AlertTitle>
                          <AlertDescription className="text-sm flex justify-between items-center">
                            <span>{log.message}</span>
                            <span className="text-xs opacity-70">
                            {formatTimestamp(log.timestamp)}
                            </span>
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
