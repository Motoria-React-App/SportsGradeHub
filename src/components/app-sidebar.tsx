// "use client"

// import * as React from "react"
// import {
//   IconInnerShadowTop,
// } from "@tabler/icons-react"
// import {
//   Dumbbell,
//   SquareTerminal,
// } from "lucide-react"

// import { NavMain } from "@/components/nav-main"
// import { NavUser } from "@/components/nav-user"
// import {
//   Sidebar,
//   SidebarContent,
//   SidebarFooter,
//   SidebarHeader,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
// } from "@/components/ui/sidebar"

// const data = {
//   user: {
//     name: "shadcn",
//     email: "m@example.com",
//     avatar: "/avatars/shadcn.jpg",
//   },
//   navMain: [
//     {
//       title: "Dashboard",
//       url: "/dashboard",
//       icon: SquareTerminal,
//       isActive: true,
//       items: [
//         {
//           title: "Classi",
//           url: "/classes",
//           icon: ""
//         },
//         {
//           title: "Studenti",
//           url: "/students",
//           icon: ""
//         }
//       ]
//     },
//     {
//       title: "Esercizi",
//       url: "/exercises",
//       icon: Dumbbell,
//     },
//   ],
// }

// export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
//   return (
//     <Sidebar collapsible="offcanvas" {...props}>
//       <SidebarHeader>
//         <SidebarMenu>
//           <SidebarMenuItem>
//             <SidebarMenuButton
//               asChild
//               className="data-[slot=sidebar-menu-button]:!p-1.5"
//             >
//               <a href="#">
//                 <IconInnerShadowTop className="!size-5" />
//                 <span className="text-base font-semibold">SportsGradeHub</span>
//               </a>
//             </SidebarMenuButton>
//           </SidebarMenuItem>
//         </SidebarMenu>
//       </SidebarHeader>
//       <SidebarContent>
//         <NavMain items={data.navMain}></NavMain>
//       </SidebarContent>
//       <SidebarFooter>
//         <NavUser user={data.user} />
//       </SidebarFooter>
//     </Sidebar>
//   )
// }


import * as React from "react"
import {
  IconInnerShadowTop,
} from "@tabler/icons-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavUser } from "./nav-user"
import { ChartArea, Dumbbell, SquareTerminal } from "lucide-react"


type itemsType = {
  title: string,
  url: string,
  icon: string,
  isActive?: boolean,
}[]

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      isActive: true,
      icon: SquareTerminal,
      items: [
        {
          title: "Classi",
          url: "/classes",
          icon: "",
        },
        {
          title: "Studenti",
          url: "/students",
          icon: ""
        }
      ] as itemsType
    },
    {
      title: "Esercizi",
      url: "/exercises",
      icon: Dumbbell,
      items: [
        {
          title: "Valutazioni",
          url: "/valutazioni",
          icon: "",
        }
      ] as itemsType
    },
    {
      title: "Analytics",
      url: "/exercises",
      icon: ChartArea,
    },
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">SportsGradeHub</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url}>
                    <item.icon className="font-light" />
                    <span className="font-medium">{item.title}</span>
                  </a>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub>
                    {item.items.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild isActive={item?.isActive || false}>
                          <a href={item.url}>{item.title}</a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}


