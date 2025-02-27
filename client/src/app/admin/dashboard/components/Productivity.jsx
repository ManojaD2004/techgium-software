"use client";
import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  ChevronsUpDown,
  Clock,
  Award,
  TrendingUp,
  Users,
  Calendar,
  Target,
  BookOpen,
  Coffee,
  Zap,
  BellRing,
  Calendar as CalendarIcon,
} from "lucide-react";

const apiResponse ={
    "status": "success",
    "data": {
        "employeeData": [
            {
                "id": 1,
                "roomId": 1,
                "empId": 7,
                "name": "Manoja D",
                "phoneNo": "9902798895",
                "avatar": "/file/v1/image/242ad1.jpg",
                "status": "Active",
                "room": "CS Lab",
                "hoursThisWeek": 25.57,
                "productivity": 45.66,
                "trend": -5.54
            },
            {
                "id": 4,
                "roomId": 1,
                "empId": 9,
                "name": "Vilas CP",
                "phoneNo": "9845263712",
                "avatar": "/file/v1/image/2a80df.jpeg",
                "status": "Active",
                "room": "CS Lab",
                "hoursThisWeek": 20.55,
                "productivity": 36.7,
                "trend": -5.91
            },
            {
                "id": 5,
                "roomId": 1,
                "empId": 11,
                "name": "Tejas Krishna",
                "phoneNo": "8105516094",
                "avatar": "/file/v1/image/2cb1d8.jpeg",
                "status": "Active",
                "room": "CS Lab",
                "hoursThisWeek": 21,
                "productivity": 37.5,
                "trend": 1.84
            },
            {
                "id": 7,
                "roomId": 1,
                "empId": 12,
                "name": "Aryan Choudhary",
                "phoneNo": "8107288787",
                "avatar": "/file/v1/image/94698a.jpg",
                "status": "Active",
                "room": "CS Lab",
                "hoursThisWeek": 18.13,
                "productivity": 32.38,
                "trend": -23.11
            },
            {
                "id": 8,
                "roomId": 1,
                "empId": 13,
                "name": "Aditya Srinivasan",
                "phoneNo": "9880284141",
                "avatar": "/file/v1/image/32e470.jpg",
                "status": "Active",
                "room": "CS Lab",
                "hoursThisWeek": 19.76,
                "productivity": 35.29,
                "trend": 6.07
            },
            {
                "id": 9,
                "roomId": 1,
                "empId": 14,
                "name": "Rahul S",
                "phoneNo": "9980941652",
                "avatar": "/file/v1/image/f16f3f.jpg",
                "status": "Active",
                "room": "CS Lab",
                "hoursThisWeek": 20.41,
                "productivity": 36.45,
                "trend": -14.5
            },
            {
                "id": 10,
                "roomId": 1,
                "empId": 15,
                "name": "Giridhar D",
                "phoneNo": "8660304942",
                "avatar": "/file/v1/image/2ddb6c.jpg",
                "status": "Active",
                "room": "CS Lab",
                "hoursThisWeek": 22.5,
                "productivity": 40.18,
                "trend": 13.98
            },
            {
                "id": 12,
                "roomId": 3,
                "empId": 9,
                "name": "Vilas CP",
                "phoneNo": "9845263712",
                "avatar": "/file/v1/image/2a80df.jpeg",
                "status": "Active",
                "room": "Cafeteria",
                "hoursThisWeek": 16.15,
                "productivity": 28.84,
                "trend": -10.67
            },
            {
                "id": 13,
                "roomId": 3,
                "empId": 11,
                "name": "Tejas Krishna",
                "phoneNo": "8105516094",
                "avatar": "/file/v1/image/2cb1d8.jpeg",
                "status": "Active",
                "room": "Cafeteria",
                "hoursThisWeek": 15.59,
                "productivity": 27.84,
                "trend": -12.81
            },
            {
                "id": 14,
                "roomId": 3,
                "empId": 7,
                "name": "Manoja D",
                "phoneNo": "9902798895",
                "avatar": "/file/v1/image/242ad1.jpg",
                "status": "Active",
                "room": "Cafeteria",
                "hoursThisWeek": 20.56,
                "productivity": 36.71,
                "trend": -6.76
            },
            {
                "id": 15,
                "roomId": 3,
                "empId": 12,
                "name": "Aryan Choudhary",
                "phoneNo": "8107288787",
                "avatar": "/file/v1/image/94698a.jpg",
                "status": "Active",
                "room": "Cafeteria",
                "hoursThisWeek": 27.77,
                "productivity": 49.59,
                "trend": 43.37
            },
            {
                "id": 16,
                "roomId": 3,
                "empId": 13,
                "name": "Aditya Srinivasan",
                "phoneNo": "9880284141",
                "avatar": "/file/v1/image/32e470.jpg",
                "status": "Active",
                "room": "Cafeteria",
                "hoursThisWeek": 17.48,
                "productivity": 31.21,
                "trend": 19.07
            },
            {
                "id": 17,
                "roomId": 3,
                "empId": 14,
                "name": "Rahul S",
                "phoneNo": "9980941652",
                "avatar": "/file/v1/image/f16f3f.jpg",
                "status": "Active",
                "room": "Cafeteria",
                "hoursThisWeek": 20.42,
                "productivity": 36.46,
                "trend": -5.38
            },
            {
                "id": 18,
                "roomId": 3,
                "empId": 15,
                "name": "Giridhar D",
                "phoneNo": "8660304942",
                "avatar": "/file/v1/image/2ddb6c.jpg",
                "status": "Active",
                "room": "Cafeteria",
                "hoursThisWeek": 26.35,
                "productivity": 47.05,
                "trend": 17.53
            },
            {
                "id": 19,
                "roomId": 4,
                "empId": 9,
                "name": "Vilas CP",
                "phoneNo": "9845263712",
                "avatar": "/file/v1/image/2a80df.jpeg",
                "status": "Active",
                "room": "AIML Lab",
                "hoursThisWeek": 20.54,
                "productivity": 36.68,
                "trend": -2.79
            },
            {
                "id": 20,
                "roomId": 4,
                "empId": 11,
                "name": "Tejas Krishna",
                "phoneNo": "8105516094",
                "avatar": "/file/v1/image/2cb1d8.jpeg",
                "status": "Active",
                "room": "AIML Lab",
                "hoursThisWeek": 21.08,
                "productivity": 37.64,
                "trend": 9.51
            },
            {
                "id": 21,
                "roomId": 4,
                "empId": 7,
                "name": "Manoja D",
                "phoneNo": "9902798895",
                "avatar": "/file/v1/image/242ad1.jpg",
                "status": "Active",
                "room": "AIML Lab",
                "hoursThisWeek": 24.87,
                "productivity": 44.41,
                "trend": 3.54
            },
            {
                "id": 22,
                "roomId": 4,
                "empId": 12,
                "name": "Aryan Choudhary",
                "phoneNo": "8107288787",
                "avatar": "/file/v1/image/94698a.jpg",
                "status": "Active",
                "room": "AIML Lab",
                "hoursThisWeek": 23.08,
                "productivity": 41.21,
                "trend": 3.64
            },
            {
                "id": 23,
                "roomId": 4,
                "empId": 13,
                "name": "Aditya Srinivasan",
                "phoneNo": "9880284141",
                "avatar": "/file/v1/image/32e470.jpg",
                "status": "Active",
                "room": "AIML Lab",
                "hoursThisWeek": 16.58,
                "productivity": 29.61,
                "trend": 26.18
            },
            {
                "id": 24,
                "roomId": 4,
                "empId": 14,
                "name": "Rahul S",
                "phoneNo": "9980941652",
                "avatar": "/file/v1/image/f16f3f.jpg",
                "status": "Active",
                "room": "AIML Lab",
                "hoursThisWeek": 15.41,
                "productivity": 27.52,
                "trend": -39.88
            },
            {
                "id": 25,
                "roomId": 4,
                "empId": 15,
                "name": "Giridhar D",
                "phoneNo": "8660304942",
                "avatar": "/file/v1/image/2ddb6c.jpg",
                "status": "Active",
                "room": "AIML Lab",
                "hoursThisWeek": 20.41,
                "productivity": 36.45,
                "trend": -4.18
            },
            {
                "id": 26,
                "roomId": 5,
                "empId": 9,
                "name": "Vilas CP",
                "phoneNo": "9845263712",
                "avatar": "/file/v1/image/2a80df.jpeg",
                "status": "Active",
                "room": "Research Department",
                "hoursThisWeek": 23.82,
                "productivity": 42.54,
                "trend": 14.19
            },
            {
                "id": 27,
                "roomId": 5,
                "empId": 7,
                "name": "Manoja D",
                "phoneNo": "9902798895",
                "avatar": "/file/v1/image/242ad1.jpg",
                "status": "Active",
                "room": "Research Department",
                "hoursThisWeek": 17.43,
                "productivity": 31.12,
                "trend": -21.56
            },
            {
                "id": 28,
                "roomId": 5,
                "empId": 11,
                "name": "Tejas Krishna",
                "phoneNo": "8105516094",
                "avatar": "/file/v1/image/2cb1d8.jpeg",
                "status": "Active",
                "room": "Research Department",
                "hoursThisWeek": 24.02,
                "productivity": 42.89,
                "trend": 39
            },
            {
                "id": 29,
                "roomId": 5,
                "empId": 12,
                "name": "Aryan Choudhary",
                "phoneNo": "8107288787",
                "avatar": "/file/v1/image/94698a.jpg",
                "status": "Active",
                "room": "Research Department",
                "hoursThisWeek": 22.97,
                "productivity": 41.02,
                "trend": -4.29
            },
            {
                "id": 30,
                "roomId": 5,
                "empId": 13,
                "name": "Aditya Srinivasan",
                "phoneNo": "9880284141",
                "avatar": "/file/v1/image/32e470.jpg",
                "status": "Active",
                "room": "Research Department",
                "hoursThisWeek": 16.18,
                "productivity": 28.89,
                "trend": -18.9
            },
            {
                "id": 31,
                "roomId": 5,
                "empId": 14,
                "name": "Rahul S",
                "phoneNo": "9980941652",
                "avatar": "/file/v1/image/f16f3f.jpg",
                "status": "Active",
                "room": "Research Department",
                "hoursThisWeek": 28.03,
                "productivity": 50.05,
                "trend": 17.48
            },
            {
                "id": 32,
                "roomId": 5,
                "empId": 15,
                "name": "Giridhar D",
                "phoneNo": "8660304942",
                "avatar": "/file/v1/image/2ddb6c.jpg",
                "status": "Active",
                "room": "Research Department",
                "hoursThisWeek": 23.04,
                "productivity": 41.14,
                "trend": -0.26
            }
        ],
        "weeklyTrendData": [
            {
                "week": "Week 1",
                "totalHours": 589.7,
                "avgProductivity": 75.22
            },
            {
                "week": "Week 2",
                "totalHours": 589.41,
                "avgProductivity": 75.18
            },
            {
                "week": "Week 3",
                "totalHours": 601.32,
                "avgProductivity": 76.7
            },
            {
                "week": "Week 4",
                "totalHours": 571.9,
                "avgProductivity": 72.95
            }
        ],
        "hoursWorkedData": [
            {
                "day": "Wed",
                "This Week": 98.35,
                "Last Week": 84.76
            },
            {
                "day": "Tue",
                "This Week": 84.34,
                "Last Week": 82.36
            },
            {
                "day": "Mon",
                "This Week": 76.41,
                "Last Week": 89.44
            },
            {
                "day": "Sun",
                "This Week": 77.11,
                "Last Week": 85.16
            },
            {
                "day": "Sat",
                "This Week": 84.47,
                "Last Week": 79.46
            },
            {
                "day": "Fri",
                "This Week": 76.89,
                "Last Week": 80.91
            },
            {
                "day": "Thu",
                "This Week": 92.14,
                "Last Week": 87.31
            }
        ],
        "productivityData": [
            {
                "name": "Manoja D",
                "hours": 394.36,
                "productivity": 78.87
            },
            {
                "name": "Vilas CP",
                "hours": 370.82,
                "productivity": 74.76
            },
            {
                "name": "Tejas Krishna",
                "hours": 341.96,
                "productivity": 68.94
            },
            {
                "name": "Aryan Choudhary",
                "hours": 386.14,
                "productivity": 77.85
            },
            {
                "name": "Aditya Srinivasan",
                "hours": 345.12,
                "productivity": 69.58
            },
            {
                "name": "Rahul S",
                "hours": 398.67,
                "productivity": 80.38
            },
            {
                "name": "Giridhar D",
                "hours": 389.26,
                "productivity": 78.48
            }
        ],
        "departmentHoursData": [
            {
                "name": "Cafeteria",
                "hours": 628.86
            },
            {
                "name": "AIML Lab",
                "hours": 658.84
            },
            {
                "name": "CS Lab",
                "hours": 660.13
            },
            {
                "name": "Research Department",
                "hours": 678.49
            }
        ],
        "topPerformers": [
            {
                "name": "Rahul S",
                "hours": 398.67,
                "productivity": 80.38
            },
            {
                "name": "Manoja D",
                "hours": 394.36,
                "productivity": 78.87
            },
            {
                "name": "Giridhar D",
                "hours": 389.26,
                "productivity": 78.48
            }
        ]
    }
}

// Data processing
const employeeData = apiResponse.data.employeeData;
const weeklyTrendData = apiResponse.data.weeklyTrendData;
const hoursWorkedData = apiResponse.data.hoursWorkedData.sort(
  (a, b) =>
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(a.day) -
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(b.day)
);
const productivityData = apiResponse.data.productivityData;
const departmentHoursData = apiResponse.data.departmentHoursData;
const topPerformers = apiResponse.data.topPerformers;

// Skill matrix data remains the same
const skillMatrixData = [
  { subject: "Coding", A: 120, B: 110, fullMark: 150 },
  { subject: "Communication", A: 98, B: 130, fullMark: 150 },
  { subject: "Teamwork", A: 86, B: 130, fullMark: 150 },
  { subject: "Problem Solving", A: 99, B: 100, fullMark: 150 },
  { subject: "Time Management", A: 85, B: 90, fullMark: 150 },
  { subject: "Technical Knowledge", A: 65, B: 85, fullMark: 150 },
];

// Constants
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#83a6ed",
];
const RADIAN = Math.PI / 180;
const uniqueRooms = [...new Set(employeeData.map((employee) => employee.room))];

// Custom label for pie chart
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function EmployeeDashboard() {
  const [timeRange, setTimeRange] = useState("week");
  const [selectedRoom, setSelectedRoom] = useState("all");

  // Calculate metrics
  const totalHours = useMemo(
    () =>
      employeeData.reduce((sum, emp) => sum + emp.hoursThisWeek, 0).toFixed(1),
    [employeeData]
  );

  const avgProductivity = useMemo(
    () =>
      (
        employeeData.reduce((sum, emp) => sum + emp.productivity, 0) /
        employeeData.length
      ).toFixed(1),
    [employeeData]
  );

  const activeEmployees = useMemo(
    () =>
      new Set(
        employeeData
          .filter((emp) => emp.status === "Active")
          .map((emp) => emp.empId)
      ).size,
    [employeeData]
  );

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Dashboard Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Employee Productivity Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Track working hours and employee performance
          </p>
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
                <h3 className="text-2xl font-bold mt-1">{totalHours} hrs</h3>
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
                <p className="text-sm font-medium text-gray-500">
                  Avg. Productivity
                </p>
                <h3 className="text-2xl font-bold mt-1">{avgProductivity}%</h3>
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
                <p className="text-sm font-medium text-gray-500">
                  Top Performer
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  {topPerformers[0]?.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {topPerformers[0]?.productivity}% productivity rate
                </p>
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
                <p className="text-sm font-medium text-gray-500">
                  Active Employees
                </p>
                <h3 className="text-2xl font-bold mt-1">{activeEmployees}</h3>
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
          <CardDescription>
            Total hours and avg. productivity percentage by month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weeklyTrendData}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="colorProductivity"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
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
            <CardDescription>
              This {timeRange} vs last {timeRange}
            </CardDescription>
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
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
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
          <CardDescription>
            Comparing top performer vs. team average
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart outerRadius={150} data={skillMatrixData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis />
              <Radar
                name="Top Performer"
                dataKey="A"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Radar
                name="Team Average"
                dataKey="B"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.6}
              />
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
            <CardDescription>
              Productivity score based on completed tasks per hour
            </CardDescription>
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
                <Bar
                  yAxisId="left"
                  dataKey="productivity"
                  name="Productivity %"
                  fill="#0088FE"
                />
                <Bar
                  yAxisId="right"
                  dataKey="hours"
                  name="Hours Worked"
                  fill="#FF8042"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers Section with enhanced UI */}
      <Card className="border-none shadow-lg mb-8">
        <CardHeader>
          <CardTitle>Top Performers Spotlight</CardTitle>
          <CardDescription>
            Highest productivity this {timeRange}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topPerformers.map((employee, index) => (
              <div
                key={employee.id}
                className="bg-white rounded-lg p-6 shadow-md border border-gray-100"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <Avatar className="h-20 w-20 mb-4">
                      <AvatarFallback className="bg-blue-100 text-blue-800 text-xl">
                        {employee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
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
                    {index === 0
                      ? "Frontend Developer"
                      : index === 1
                      ? "Backend Developer"
                      : "Data Analyst"}
                  </p>
                  <div className="w-full mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Productivity</span>
                      <span className="font-medium">
                        {employee.productivity}%
                      </span>
                    </div>
                    <Progress value={employee.productivity} className="h-2" />
                  </div>
                  <div className="flex items-center mt-2">
                    <span className="text-green-500 font-medium">
                      {employee.increase}
                    </span>
                    <span className="text-gray-500 text-sm ml-1">
                      from last {timeRange}
                    </span>
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
      {/* Employee List Section with enhanced UI */}
      <Card className="border-none shadow-lg">
        <Tabs defaultValue="all" onValueChange={setSelectedRoom}>
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CardTitle>Employee Overview</CardTitle>
              <TabsList>
                <TabsTrigger value="all">All Employees</TabsTrigger>
                {uniqueRooms.map((room) => (
                  <TabsTrigger key={room} value={room}>
                    {room}
                  </TabsTrigger>
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
                        .filter(
                          (employee) => tab === "all" || employee.room === tab
                        )
                        .map((employee) => (
                          <tr key={employee.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-blue-100 text-blue-800">
                                    {employee.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="ml-4">
                                  <div className="font-medium text-gray-900">
                                    {employee.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {employee.role}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200"
                              >
                                {employee.room}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium">
                              {employee.hoursThisWeek} hrs
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <Progress
                                  value={employee.productivity}
                                  className="h-2 w-full max-w-xs"
                                />
                                <span className="ml-2 text-sm font-medium">
                                  {employee.productivity}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                {employee.trend > 0
                                  ? `+${employee.trend}%`
                                  : `${employee.trend}%`}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div
                                  className={`h-2 w-2 rounded-full mr-2 ${
                                    employee.status === "Active"
                                      ? "bg-green-500"
                                      : "bg-red-500"
                                  }`}
                                ></div>
                                <span className="text-sm text-gray-500">
                                  {employee.status}
                                </span>
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
