// pages/index.js
import { useState, useEffect } from 'react';
import { Bell, Users, AlertTriangle, UserCheck, UserX } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Notification() {

  const [rooms, setRooms] = useState([
    { id: 1, name: 'Room 1', maxCapacity: 10, currentOccupancy: 2, status: 'normal' },
    { id: 2, name: 'Room 2', maxCapacity: 15, currentOccupancy: 13, status: 'normal' },
    { id: 3, name: 'Room 3', maxCapacity: 12, currentOccupancy: 19, status: 'exceeded' },
    { id: 4, name: 'Room 4', maxCapacity: 8, currentOccupancy: 5, status: 'normal' },
  ]);

  const [logs, setLogs] = useState([
    { id: 1, type: 'warning', message: 'Maximum capacity exceeded in Room 3', timestamp: '10:15 AM' },
    { id: 2, type: 'alert', message: 'Intruder alert in Room 2', timestamp: '10:08 AM' },
    { id: 3, type: 'info', message: 'Room 1 occupancy at 80%', timestamp: '09:45 AM' },
    { id: 4, type: 'warning', message: 'Trespassing detected in Room 4', timestamp: '09:30 AM' },
    { id: 5, type: 'alert', message: 'Security breach in Room 3', timestamp: '09:15 AM' },
    { id: 6, type: 'info', message: 'Room 2 occupancy normal', timestamp: '09:00 AM' },
    { id: 7, type: 'warning', message: 'Maximum capacity exceeded in Room 3', timestamp: '08:50 AM' },
    { id: 8, type: 'info', message: 'All rooms clear', timestamp: '08:30 AM' },
  ]);

  
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly update room occupancy
      setRooms(prevRooms => 
        prevRooms.map(room => {
          const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
          const newOccupancy = Math.max(0, room.currentOccupancy + change);
          const newStatus = newOccupancy > room.maxCapacity ? 'exceeded' : 'normal';
          
          // Add a log if status changed
          if (newStatus !== room.status) {
            const newLog = {
              id: Date.now(),
              type: newStatus === 'exceeded' ? 'warning' : 'info',
              message: newStatus === 'exceeded' 
                ? `Maximum capacity exceeded in ${room.name}`
                : `${room.name} occupancy returned to normal`,
              timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };
            setLogs(prevLogs => [newLog, ...prevLogs]);
          }
          
          return { 
            ...room, 
            currentOccupancy: newOccupancy,
            status: newStatus
          };
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const alertInterval = setInterval(() => {
      const alertTypes = ['intruder', 'trespassing', 'security'];
      const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
      const randomAlertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      
      let message = '';
      let type = 'alert';
      
      switch(randomAlertType) {
        case 'intruder':
          message = `Intruder alert in ${randomRoom.name}`;
          break;
        case 'trespassing':
          message = `Trespassing detected in ${randomRoom.name}`;
          break;
        case 'security':
          message = `Security breach in ${randomRoom.name}`;
          break;
      }
      
      const newLog = {
        id: Date.now(),
        type,
        message,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };
      
      setLogs(prevLogs => [newLog, ...prevLogs]);
    }, 3000);
    
    return () => clearInterval(alertInterval);
  }, [rooms]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto p-4">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Room Monitoring Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Live room occupancy tracking and security alerts</p>
        </header>

        {/* Room Occupancy Section - Always visible at top */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Room Occupancy</h2>
            <Badge variant="outline" className="gap-1">
              <Bell size={14} className="text-amber-500" />
              <span>{logs.filter(log => log.type === 'alert' || log.type === 'warning').length} Active Alerts</span>
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {rooms.map(room => (
              <Card key={room.id} className={`overflow-hidden ${room.status === 'exceeded' ? 'border-red-400 dark:border-red-600' : ''}`}>
                <CardHeader className={`pb-2 ${room.status === 'exceeded' ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                  <CardTitle className="flex justify-between items-center">
                    <span>{room.name}</span>
                    {room.status === 'exceeded' && (
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
                      <Users size={20} className={room.status === 'exceeded' ? 'text-red-500' : 'text-blue-500'} />
                      <span className="text-2xl font-bold">{room.currentOccupancy}</span>
                    </div>
                    <div className="flex items-center">
                      {room.status === 'exceeded' ? (
                        <Badge variant="destructive" className="gap-1">
                          <UserX size={14} />
                          <span>Exceeded</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800">
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
                        room.status === 'exceeded' 
                          ? 'bg-red-500' 
                          : room.currentOccupancy / room.maxCapacity > 0.8 
                            ? 'bg-amber-500' 
                            : 'bg-green-500'
                      }`} 
                      style={{ width: `${Math.min(100, (room.currentOccupancy / room.maxCapacity) * 100)}%` }}
                    ></div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* Notification Logs Section - Always visible below */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Notification Logs</h2>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Security & Occupancy Logs</CardTitle>
              <CardDescription>Real-time notification system</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {logs.map(log => (
                    <Alert 
                      key={log.id} 
                      variant={log.type === 'alert' ? 'destructive' : log.type === 'warning' ? 'default' : 'outline'}
                      className={`
                        ${log.type === 'alert' ? 'border-red-500 bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-300' : ''} 
                        ${log.type === 'warning' ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-300' : ''}
                        ${log.type === 'info' ? 'border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300' : ''}
                      `}
                    >
                      <div className="flex items-start">
                        {log.type === 'alert' && <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />}
                        {log.type === 'warning' && <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />}
                        {log.type === 'info' && <Users className="h-4 w-4 mr-2 text-blue-500" />}
                        <div className="w-full">
                          <AlertTitle className="text-sm font-medium mb-1">{log.type.toUpperCase()}</AlertTitle>
                          <AlertDescription className="text-sm flex justify-between items-center">
                            <span>{log.message}</span>
                            <span className="text-xs opacity-70">{log.timestamp}</span>
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