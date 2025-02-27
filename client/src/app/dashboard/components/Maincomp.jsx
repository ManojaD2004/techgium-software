"use client"
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChevronsUpDown, Clock, Award, TrendingUp, Users, Calendar, Target, BookOpen, Coffee, Zap, BellRing, Calendar as CalendarIcon } from 'lucide-react';

// Sample data

const employeeData = [
    { id: 1, name: "Alice Johnson", role: "Software Engineer", room: "Room 1", hoursThisWeek: 40, productivity: 85, trend: 5, status: "Active",avatar: '/api/placeholder/40/40' },
    { id: 2, name: "Bob Smith", role: "UI/UX Designer", room: "Room 2", hoursThisWeek: 38, productivity: 78, trend: 3, status: "Active",avatar: '/api/placeholder/40/40'},
    { id: 3, name: "Charlie Brown", role: "Backend Developer", room: "Room 1", hoursThisWeek: 42, productivity: 90, trend: 7, status: "Active",avatar: '/api/placeholder/40/40' },
    { id: 4, name: "David Lee", role: "Marketing Manager", room: "Room 3", hoursThisWeek: 35, productivity: 70, trend: 2, status: "Active",avatar: '/api/placeholder/40/40' },
    { id: 5, name: "Emma Wilson", role: "Frontend Developer", room: "Room 2", hoursThisWeek: 39, productivity: 80, trend: 4, status: "Active",avatar: '/api/placeholder/40/40' },
    { id: 6, name: "Fiona Taylor", role: "Graphic Designer", room: "Room 3", hoursThisWeek: 36, productivity: 76, trend: 3, status: "Active" ,avatar: '/api/placeholder/40/40'},
    { id: 7, name: "George Anderson", role: "HR Specialist", room: "Room 1", hoursThisWeek: 34, productivity: 72, trend: 1, status: "Active" ,avatar: '/api/placeholder/40/40'},
    { id: 8, name: "Hannah Clark", role: "DevOps Engineer", room: "Room 2", hoursThisWeek: 41, productivity: 88, trend: 6, status: "Active",avatar: '/api/placeholder/40/40' },
    { id: 9, name: "Ian Wright", role: "Content Writer", room: "Room 3", hoursThisWeek: 37, productivity: 74, trend: 2, status: "Active",avatar: '/api/placeholder/40/40' },
  ];

const hoursWorkedData = [
  { day: 'Mon', 'This Week': 45, 'Last Week': 40 },
  { day: 'Tue', 'This Week': 48, 'Last Week': 42 },
  { day: 'Wed', 'This Week': 47, 'Last Week': 45 },
  { day: 'Thu', 'This Week': 49, 'Last Week': 44 },
  { day: 'Fri', 'This Week': 45, 'Last Week': 40 },
  { day: 'Sat', 'This Week': 35, 'Last Week': 30 },
  { day: 'Sun', 'This Week': 25, 'Last Week': 20 },
];

const productivityData = [
  { name: 'Alex J.', productivity: 94, hours: 47 },
  { name: 'Sarah M.', productivity: 88, hours: 42 },
  { name: 'Michael C.', productivity: 92, hours: 45 },
  { name: 'Emma W.', productivity: 82, hours: 38 },
  { name: 'David K.', productivity: 90, hours: 44 },
];

const departmentHoursData = [
  { name: 'Room1', hours: 92 },
  { name: 'Room2', hours: 42 },
  { name: 'Room3', hours: 38 },

];

const topPerformers = [
  { id: 1, name: 'Alex Johnson', productivity: 94, increase: '+12%' },
  { id: 3, name: 'Michael Chen', productivity: 92, increase: '+8%' },
  { id: 5, name: 'David Kim', productivity: 90, increase: '+5%' },
];

// Monthly trend data for area chart
const weeklyTrendData = [
    { week: 'Week 1', totalHours: 300, avgProductivity: 50 },
    { week: 'Week 2', totalHours: 600, avgProductivity: 85 },
    { week: 'Week 3', totalHours: 900, avgProductivity: 87 },
    { week: 'Week 4', totalHours: 1200, avgProductivity: 90 },
    { week: 'Week 5', totalHours: 1500, avgProductivity: 92 },
  ];
  

// Skill matrix data for radar chart
const skillMatrixData = [
  { subject: 'Coding', A: 120, B: 110, fullMark: 150 },
  { subject: 'Communication', A: 98, B: 130, fullMark: 150 },
  { subject: 'Teamwork', A: 86, B: 130, fullMark: 150 },
  { subject: 'Problem Solving', A: 99, B: 100, fullMark: 150 },
  { subject: 'Time Management', A: 85, B: 90, fullMark: 150 },
  { subject: 'Technical Knowledge', A: 65, B: 85, fullMark: 150 },
];




// Project contribution data


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#83a6ed'];
const RADIAN = Math.PI / 180;
const uniqueRooms = [...new Set(employeeData.map((employee) => employee.room))];

// Custom label for pie chart
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function EmployeeDashboard() {
  const [timeRange, setTimeRange] = useState('week');
  const [selectedRoom, setSelectedRoom] = useState("all");

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Employee Productivity Dashboard</h1>
          <p className="text-gray-500 mt-1">Track working hours and employee performance</p>
        </div>
        <div className="flex gap-4 flex-wrap">
          <Select defaultValue="week" onValueChange={setTimeRange}>
            <SelectTrigger className="w-36 bg-white">
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <CalendarIcon className="h-4 w-4 mr-2" /> Custom Range
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Hours</p>
                <h3 className="text-2xl font-bold mt-1">294 hrs</h3>
                <p className="text-xs text-green-500 mt-1 flex items-center">
                  <ChevronsUpDown className="h-4 w-4 mr-1" />
                  +12% from last {timeRange}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg. Productivity</p>
                <h3 className="text-2xl font-bold mt-1">89.2%</h3>
                <p className="text-xs text-green-500 mt-1 flex items-center">
                  <ChevronsUpDown className="h-4 w-4 mr-1" />
                  +5% from last {timeRange}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Top Performer</p>
                <h3 className="text-2xl font-bold mt-1">Alex J.</h3>
                <p className="text-xs text-gray-500 mt-1">94% productivity rate</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Employees</p>
                <h3 className="text-2xl font-bold mt-1">5/5</h3>
                <p className="text-xs text-gray-500 mt-1">100% attendance</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New: Annual Trend Section */}
      <Card className="border-none shadow-lg mb-8">
        <CardHeader>
          <CardTitle>Annual Productivity Trends</CardTitle>
          <CardDescription>Total hours and avg. productivity percentage by month</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weeklyTrendData}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProductivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="week" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="totalHours" 
                yAxisId="left"
                stroke="#8884d8" 
                fillOpacity={1} 
                fill="url(#colorHours)" 
              />
              <Area 
                type="monotone" 
                dataKey="avgProductivity" 
                yAxisId="right"
                stroke="#82ca9d" 
                fillOpacity={1} 
                fill="url(#colorProductivity)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2 border-none shadow-lg">
          <CardHeader>
            <CardTitle>Hours Worked Comparison</CardTitle>
            <CardDescription>This {timeRange} vs last {timeRange}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hoursWorkedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="This Week" 
                  stroke="#0088FE" 
                  strokeWidth={2} 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="Last Week" 
                  stroke="#82ca9d" 
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Hours by Department</CardTitle>
            <CardDescription>Total hours this {timeRange}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentHoursData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="hours"
                  label={renderCustomizedLabel}
                >
                  {departmentHoursData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      

      {/* New: Team Skill Matrix Section */}
      <Card className="border-none shadow-lg mb-8">
        <CardHeader>
          <CardTitle>Team Skill Matrix</CardTitle>
          <CardDescription>Comparing top performer vs. team average</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart outerRadius={150} data={skillMatrixData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis />
              <Radar name="Top Performer" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <Radar name="Team Average" dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Productivity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2 border-none shadow-lg">
          <CardHeader>
            <CardTitle>Employee Productivity vs Hours Worked</CardTitle>
            <CardDescription>Productivity score based on completed tasks per hour</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={productivityData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#0088FE" />
                <YAxis yAxisId="right" orientation="right" stroke="#FF8042" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="productivity" name="Productivity %" fill="#0088FE" />
                <Bar yAxisId="right" dataKey="hours" name="Hours Worked" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        
      </div>

      {/* Top Performers Section with enhanced UI */}
      <Card className="border-none shadow-lg mb-8">
        <CardHeader>
          <CardTitle>Top Performers Spotlight</CardTitle>
          <CardDescription>Highest productivity this {timeRange}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topPerformers.map((employee, index) => (
              <div key={employee.id} className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <Avatar className="h-20 w-20 mb-4">
                      <AvatarFallback className="bg-blue-100 text-blue-800 text-xl">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {index === 0 && (
                      <div className="absolute -top-2 -right-2">
                        <Badge className="bg-yellow-500">
                          <Award className="h-3 w-3 mr-1" /> Top
                        </Badge>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg">{employee.name}</h3>
                  <p className="text-gray-500 text-sm mb-2">
                    {index === 0 ? 'Frontend Developer' : 
                     index === 1 ? 'Backend Developer' : 'Data Analyst'}
                  </p>
                  <div className="w-full mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Productivity</span>
                      <span className="font-medium">{employee.productivity}%</span>
                    </div>
                    <Progress value={employee.productivity} className="h-2" />
                  </div>
                  <div className="flex items-center mt-2">
                    <span className="text-green-500 font-medium">{employee.increase}</span>
                    <span className="text-gray-500 text-sm ml-1">from last {timeRange}</span>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                      <Target className="h-3 w-3 mr-1" /> Goal Achiever
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                      <Zap className="h-3 w-3 mr-1" /> Fast Learner
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* New: Recent Activity Timeline */}
      <Card className="border-none shadow-lg mb-8">
        <CardHeader>
          <CardTitle>Recent Activity Timeline</CardTitle>
          <CardDescription>Employee activities from today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {[
              { time: '9:30 AM', user: 'Alex Johnson', action: 'Started work on Project Alpha', icon: <Clock className="h-5 w-5 text-blue-500" /> },
              { time: '10:15 AM', user: 'Sarah Miller', action: 'Completed 3 design tasks', icon: <BookOpen className="h-5 w-5 text-green-500" /> },
              { time: '11:45 AM', user: 'Michael Chen', action: 'Fixed critical bug in backend API', icon: <Zap className="h-5 w-5 text-yellow-500" /> },
              { time: '12:30 PM', user: 'Team', action: 'Lunch break', icon: <Coffee className="h-5 w-5 text-orange-500" /> },
              { time: '2:00 PM', user: 'Emma Wilson', action: 'Started sprint planning meeting', icon: <BellRing className="h-5 w-5 text-purple-500" /> }
            ].map((activity, index) => (
              <div key={index} className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-50">
                    {activity.icon}
                  </div>
                  {index < 4 && <div className="h-full w-0.5 bg-gray-200 mt-2"></div>}
                </div>
                <div>
                  <div className="flex items-center">
                    <p className="font-medium">{activity.user}</p>
                    <Badge variant="outline" className="ml-2">{activity.time}</Badge>
                  </div>
                  <p className="text-gray-600 mt-1">{activity.action}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Employee List Section with enhanced UI */}
      <Card className="border-none shadow-lg">
      <Tabs defaultValue="all" onValueChange={setSelectedRoom}>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle>Employee Overview</CardTitle>
            <TabsList>
              <TabsTrigger value="all">All Employees</TabsTrigger>
              {uniqueRooms.map((room) => (
                <TabsTrigger key={room} value={room}>{room}</TabsTrigger>
              ))}
            </TabsList>
          </div>
        </CardHeader>
        <CardContent>
          {["all", ...uniqueRooms].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0 pt-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-3">Employee</th>
                      <th className="px-6 py-3">Room</th>
                      <th className="px-6 py-3">Hours This Week</th>
                      <th className="px-6 py-3">Productivity</th>
                      <th className="px-6 py-3">Trend</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employeeData
                      .filter((employee) => tab === "all" || employee.room === tab)
                      .map((employee) => (
                        <tr key={employee.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-blue-100 text-blue-800">
                                  {employee.name.split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="ml-4">
                                <div className="font-medium text-gray-900">{employee.name}</div>
                                <div className="text-sm text-gray-500">{employee.role}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {employee.room}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            {employee.hoursThisWeek} hrs
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <Progress value={employee.productivity} className="h-2 w-full max-w-xs" />
                              <span className="ml-2 text-sm font-medium">{employee.productivity}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                              {employee.trend > 0 ? `+${employee.trend}%` : `${employee.trend}%`}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div
                                className={`h-2 w-2 rounded-full mr-2 ${employee.status === "Active" ? "bg-green-500" : "bg-red-500"}`}
                              ></div>
                              <span className="text-sm text-gray-500">{employee.status}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          ))}
        </CardContent>
      </Tabs>
    </Card>
    </div>
  );
}