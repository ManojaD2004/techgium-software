"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "./nav-main"
import { TeamSwitcher } from "./team-switcher"
import { NavUser } from "./nav-user"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"


const data = {
  user: {
    name: "Vilas",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
     
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
     
    },
  ]
 
}

export function AppSidebar({ ...props }) {
  return (
    <Sidebar collapsible="icon" {...props} >
      <SidebarHeader>
        <TeamSwitcher/>
      </SidebarHeader>
      <SidebarContent>
        <NavMain  />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
