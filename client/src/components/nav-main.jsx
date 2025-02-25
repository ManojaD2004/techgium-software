"use client"

import { SquareTerminal, Bot, BookOpen, Settings2 } from "lucide-react"

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
    icon: SquareTerminal,
    isActive: true,
  },
  {
    title: "Models",
    url: "/admin/model",
    icon: Bot,
  },
  {
    title: "Add user",
    url: "/admin/adduser",
    icon: BookOpen,
  },
  {
    title: "Add Room",
    url: "/admin/room",
    icon: Settings2,
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
