"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, User, Settings } from "lucide-react";
import toast from "react-hot-toast";
import API_LINK from "./backendLink/link";

export default function Home() {
  const [adminFormOpen, setAdminFormOpen] = useState(false);
  const router = useRouter();

  const openAdminForm = () => setAdminFormOpen(true);
  const closeAdminForm = () => setAdminFormOpen(false);

  const handleUserLogin = () => {
    router.push("/sign-in");
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center overflow-hidden">
      {/* Main split container */}
      <div className="w-full h-full flex flex-col md:flex-row items-center relative">
        {/* User side */}
        <div
          onClick={handleUserLogin}
          className="w-full md:w-1/2 h-1/2 md:h-full bg-black/5 flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-black/15 relative overflow-hidden group"
        >
          <div className="flex flex-col items-center text-white z-10 transform transition-transform duration-300 group-hover:-translate-y-2">
            <User className="w-16 h-16 mb-4 opacity-90" />
            <h2 className="text-3xl font-light mb-1 text-shadow">User Login</h2>
            <p className="text-white/80">Check the personnal milestone</p>
          </div>

          {/* Particles for user side */}
          <Particles side="user" />
        </div>

        {/* Divider line */}
        <div className="absolute w-px h-2/3 bg-white/70 shadow-glow hidden md:block"></div>
        <div className="absolute h-px w-2/3 bg-white/70 shadow-glow md:hidden"></div>

        {/* Admin side */}
        <div
          onClick={openAdminForm}
          className="w-full md:w-1/2 h-1/2 md:h-full bg-black/10 flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-black/15 relative overflow-hidden group"
        >
          <div className="flex flex-col items-center text-white z-10 transform transition-transform duration-300 group-hover:-translate-y-2">
            <Settings className="w-16 h-16 mb-4 opacity-90" />
            <h2 className="text-3xl font-light mb-1 text-shadow">
              Admin Login
            </h2>
            <p className="text-white/80">Access system controls</p>
          </div>

          <Particles side="admin" />
        </div>
      </div>

      {/* Admin Login Form */}
      <AdminLoginForm isOpen={adminFormOpen} onClose={closeAdminForm} />
    </div>
  );
}

function AdminLoginForm({ isOpen, onClose }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log(username);
      console.log(password);
      const userName = username;

      const response = await fetch(
        `${API_LINK}/user/v1/login/admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          credentials: "include",

          body: JSON.stringify({ userName, password }),
        }
      );

      const data = await response.json();
      console.log(data);

      if (!response.ok) {
        toast.error(data.message || "Login failed");
        return;
      }

      router.push("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-white flex items-center justify-center transition-opacity duration-300 z-50 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 text-black hover:bg-white/10"
      >
        <X className="w-10 h-10 " />
      </Button>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={isOpen ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-indigo-500" />
              <CardTitle className="text-xl">Admin Login</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 bg-red-100 border border-red-200 text-red-600 text-sm rounded">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter admin username"
                  className="h-11"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  className="h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 mt-6 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Particles component
function Particles({ side }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const generateParticles = () => {
      return Array.from({ length: 20 }).map((_, index) => {
        const size = Math.random() * 4 + 1;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const delay = Math.random() * 10;
        const duration = Math.random() * 10 + 10;

        return (
          <div
            key={`${side}-particle-${index}`}
            className="absolute rounded-full bg-white/40"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${posX}%`,
              top: `${posY}%`,
              animation: `float ${duration}s linear infinite`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      });
    };

    setParticles(generateParticles());
  }, []);

  return <>{particles}</>;
}
