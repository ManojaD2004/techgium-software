"use client";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LineChart,
  Line,
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
  Target,
  Zap,
  Calendar as CalendarIcon,
  Phone,
} from "lucide-react";

const hoursWorkedData = [
  { day: "Mon", "This Week": 45, "Last Week": 40 },
  { day: "Tue", "This Week": 48, "Last Week": 42 },
  { day: "Wed", "This Week": 47, "Last Week": 45 },
  { day: "Thu", "This Week": 49, "Last Week": 44 },
  { day: "Fri", "This Week": 45, "Last Week": 40 },
  { day: "Sat", "This Week": 35, "Last Week": 30 },
  { day: "Sun", "This Week": 25, "Last Week": 20 },
];

const departmentHoursData = [
  { name: "Room1", hours: 92 },
  { name: "Room2", hours: 42 },
  { name: "Room3", hours: 38 },
];

const topPerformers = [
  { id: 1, name: "Alex Johnson", productivity: 94, increase: "+12%" },
  { id: 3, name: "Michael Chen", productivity: 92, increase: "+8%" },
  { id: 5, name: "David Kim", productivity: 90, increase: "+5%" },
];


const skillMatrixData = [
  { subject: "Coding", A: 120, B: 110, fullMark: 150 },
  { subject: "Communication", A: 98, B: 130, fullMark: 150 },
  { subject: "Teamwork", A: 86, B: 130, fullMark: 150 },
  { subject: "Problem Solving", A: 99, B: 100, fullMark: 150 },
  { subject: "Time Management", A: 85, B: 90, fullMark: 150 },
  { subject: "Technical Knowledge", A: 65, B: 85, fullMark: 150 },
];

const employeeInfo = {
  firstName: "Ava",
  lastName:"Adam",
  role: "Senior Software Engineer",
  status: "Active",
  room: "CS Lab",
  phone: "9902798895",
  imgURL:
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
};

const basicInfo={
  totalHours:"123",
  totalHoursPerc:"12%",
  averageProductivy:"89%",
  averageProductivyPerc:"-5%"

}

// Project contribution data

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#83a6ed",
];
const RADIAN = Math.PI / 180;

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

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
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
          <Button className="bg-white">
            <CalendarIcon className="h-4 w-4 mr-2" /> Week
          </Button>
        </div>
      </div>

      {/* Employee Info Section */}
      <Card className="border-none shadow-lg mb-8 bg-gradient-to-r from-blue-50 to-purple-50 hover:shadow-xl transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            {/* Avatar with online image */}
            <Avatar className="h-20 w-20 border-2 border-white shadow-md">
              <img
                src={employeeInfo.imgURL}
                alt={`${employeeInfo.firstName}'s Avatar`}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                {employeeInfo.firstName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            {/* Employee Details */}
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold text-gray-800">
                {employeeInfo.firstName} {employeeInfo.lastName}
              </h2>
              <p className="text-gray-600 text-sm">{employeeInfo.role}</p>
              <div className="flex items-center space-x-3">
                <Badge
                  variant="outline"
                  className="bg-green-100 border-green-200 text-green-800"
                >
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                  {employeeInfo.status} - {employeeInfo.room}
                </Badge>
                <div className="flex items-center space-x-2 text-gray-500">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{employeeInfo.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Hours</p>
                <h3 className="text-2xl font-bold mt-1">{basicInfo.totalHours} hrs</h3>
                <p className="text-xs text-green-500 mt-1 flex items-center">
                  <ChevronsUpDown className="h-4 w-4 mr-1" />
                  {basicInfo.totalHoursPerc} from last {timeRange}
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
                <h3 className="text-2xl font-bold mt-1">{basicInfo.averageProductivy}</h3>
                <p className="text-xs text-green-500 mt-1 flex items-center">
                  <ChevronsUpDown className="h-4 w-4 mr-1" />
                  {basicInfo.averageProductivyPerc} from last {timeRange}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}
