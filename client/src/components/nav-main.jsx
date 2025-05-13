"use client"

import {  Camera, User, UserPlus2Icon, PlusCircleIcon, BarChart2Icon, MessageCircleCodeIcon, CameraIcon, LucideCameraOff, SwitchCamera } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navMain = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: BarChart2Icon,
    isActive: true,
  },
  {
    title: "Survillance",
    url: "/admin/camera",
    icon: Camera,
  },
  {
    title: "Add user",
    url: "/admin/adduser",
    icon: UserPlus2Icon,
  },
  {
    title: "Add Room",
    url: "/admin/room",
    icon: PlusCircleIcon,
  },
  {
    title: "Add Camera",
    url: "/admin/addcamera",
    icon: SwitchCamera,
  },
  {
    title: "Chatbot",
    url: "/admin/chatbot",
    icon: MessageCircleCodeIcon,
  },
]

export function NavMain() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {navMain.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton tooltip={item.title} asChild>
              <a href={item.url} className="flex items-center gap-2">
                <item.icon className="size-4" />
                <span>{item.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
