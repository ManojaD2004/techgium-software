"use client";
import React, { useState, useEffect } from "react";
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
import API_LINK from "@/app/backendLink/link";
import toast from "react-hot-toast";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#83a6ed",
];
const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
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
  const [timeRange] = useState("week");
  const [apiData, setApiData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${API_LINK}/user/v1/statistics/dashboard/employee`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
          }
        );
        const data = await response.json();
        if (!response.ok) {
          toast.error("Failed to fetch!!!");
          return;
        }
        setApiData(data.data);
      } catch (error) {
        toast.error("Error fetching data!!!");
        console.log(error);
      }
    };

    fetchData();
  }, []);

  if (!apiData) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header Section */}
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
            <Avatar className="h-20 w-20 border-2 border-white shadow-md">
              <img
                src={`${API_LINK}${apiData.employeeInfo.avatar}`}
                alt={`${apiData.employeeInfo.firstName}'s Avatar`}
                className="object-cover"
              />
            </Avatar>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold text-gray-800">
                {apiData.employeeInfo.firstName} {apiData.employeeInfo.lastName}
              </h2>
              <div className="flex items-center space-x-3">
                <Badge
                  variant="outline"
                  className="bg-green-100 border-green-200 text-green-800"
                >
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                  {apiData.employeeInfo.status}
                </Badge>
                <div className="flex items-center space-x-2 text-gray-500">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">
                    {apiData.employeeInfo.phoneNo}
                  </span>
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
                <h3 className="text-2xl font-bold mt-1">
                  {apiData.basicInfo.totalHours} hrs
                </h3>
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
                <h3 className="text-2xl font-bold mt-1">
                  {apiData.basicInfo.averageProductivy}%
                </h3>
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
            <CardDescription>This week vs last week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={apiData.hoursWorkedData}>
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
            <CardDescription>Total hours this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={apiData.departmentHoursData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="hours"
                  label={renderCustomizedLabel}
                >
                  {apiData.departmentHoursData.map((entry, index) => (
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

      {/* Team Skill Matrix Section */}
      <Card className="border-none shadow-lg mb-8">
        <CardHeader>
          <CardTitle>Team Skill Matrix</CardTitle>
          <CardDescription>
            Comparing Your performance vs Average performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart outerRadius={150} data={apiData.skillMatrixData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis />
              <Radar
                name="Average work hours"
                dataKey="A"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Radar
                name="Your work hours"
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

      {/* Top Performers Section */}
      <Card className="border-none shadow-lg mb-8">
        <CardHeader>
          <CardTitle>Top Performers Spotlight</CardTitle>
          <CardDescription>Highest productivity this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {apiData.topPerformers.map((employee, index) => (
              <div
                key={employee.empId}
                className="bg-white rounded-lg p-6 shadow-md border border-gray-100"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <Avatar className="h-20 w-20 mb-4">
                      {/* <img
                        src={`${API_LINK}${employee.avatar}`}
                        alt={employee.name}
                        className="object-cover"
                      /> */}
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
