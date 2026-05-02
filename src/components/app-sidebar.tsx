import * as React from "react"


import { MdDesk } from "react-icons/md"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroupAction,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import { NavUser } from "./nav-user"
import { useClient, useSchoolData } from "@/provider/clientProvider"
import { SchoolClass } from "@/types/types"
import {
  Home,
  Search,
  Plus,
  Activity,
  Users,
  ClipboardCheck,
  ChevronRight,
  Trophy,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCommandDialog } from "@/provider/commandDialogProvider"
import { Link } from "react-router-dom"
import { AddClassDialog } from "./add-class-dialog"
import { Kbd, KbdGroup } from "./ui/kbd"
import { useSettings } from "@/provider/settingsProvider"
import { motion } from "framer-motion"
import { staggerContainer, staggerItem } from "@/lib/motion"

// Types
type NavItemType = {
  title: string
  url: string
  icon?: React.ComponentType<{ className?: string }>
  isActive?: boolean
}


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const client = useClient();
  const { classes, refreshClasses } = useSchoolData();
  const { settings } = useSettings();
  const { openCommandDialog } = useCommandDialog();
  const [addClassDialogOpen, setAddClassDialogOpen] = React.useState(false);

  const data = {
    quickNav: [
      {
        title: "Search",
        url: "#",
        icon: Search,
        onClick: openCommandDialog,
      },
      {
        title: "Home",
        url: "/dashboard",
        icon: Home,
      },
      {
        title: "Esercizi",
        url: "/exercises",
        icon: Activity,
      },
      // {
      //   title: "Analytics",
      //   url: "/analytics",
      // },
      {
        title: "Valutazioni",
        url: "/valutazioni/all/all",
        icon: ClipboardCheck,
      },
      {
        title: "Leaderboards",
        url: "/leaderboards",
        icon: Trophy,
      },
    ],
    classes: classes.map((item: SchoolClass) => ({
      title: item.className,
      url: `/classes/${item.id}`,
      icon: MdDesk,
    })) as NavItemType[],
  }



  return (
    <>
      <Sidebar
        {...props}
        className="border-r-0"
      >

        <SidebarHeader className="pb-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="hover:bg-sidebar-accent/50 rounded-md group"
              >
                <div className="flex items-center gap-2 w-full">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-transparent text-sidebar-primary-foreground overflow-hidden">
                    <img src="/logoSGH.png" alt="SportsGradeHub Logo" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-sm font-semibold flex-1">SportsGradeHub</span>
                  {/* <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" /> */}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="gap-0">

          <SidebarGroup className="py-2">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <SidebarMenu className="gap-0.5">
                {data.quickNav.map((item, index) => (
                  <motion.div key={item.title} variants={staggerItem} custom={index}>
                    <SidebarMenuItem>
                      {item.onClick ? (
                        <SidebarMenuButton
                          onClick={item.onClick}
                          className="h-8 px-2 hover:bg-sidebar-accent/50 rounded-md flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              {item.icon && (
                                <item.icon className="size-4 text-muted-foreground" />
                              )}
                            </motion.div>
                            <span className="text-sm">{item.title}</span>
                          </div>
                          <KbdGroup>
                            <Kbd>⌥</Kbd>
                            <span>+</span>
                            <Kbd>J</Kbd>
                          </KbdGroup>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton
                          asChild
                          className="h-8 px-2 hover:bg-sidebar-accent/50 rounded-md"
                        >
                          <Link to={item.url} className="flex items-center gap-2">
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              {item.icon && (
                                <item.icon className="size-4 text-muted-foreground" />
                              )}
                            </motion.div>
                            <span className="text-sm">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  </motion.div>
                ))}
              </SidebarMenu>
            </motion.div>
          </SidebarGroup>


          <SidebarGroup className="py-2">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {!settings.collapsibleClasses ? (
                <>
                  <SidebarGroupLabel className="px-2 flex items-center w-full transition-colors group/label relative">
                    <span className="text-xs font-medium text-muted-foreground flex-1 text-left">Classi</span>
                    <motion.div
                      className="opacity-0 group-hover/label:opacity-100 transition-opacity relative top-0 right-0"
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <SidebarGroupAction
                        onClick={() => setAddClassDialogOpen(true)}
                      >
                        <Plus className="size-3.5" />
                      </SidebarGroupAction>
                    </motion.div>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu className="gap-0.5 pt-1">
                      {data.classes.length === 0 ? (
                        <motion.div variants={staggerItem}>
                          <SidebarMenuItem>
                            <SidebarMenuButton
                              className="h-8 px-2 text-muted-foreground hover:bg-sidebar-accent/50 rounded-md"
                              onClick={() => setAddClassDialogOpen(true)}
                            >
                              <Plus className="size-4" />
                              <span className="text-sm">Aggiungi classe</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        </motion.div>
                      ) : (
                        data.classes.map((item, index) => {
                          const Icon = item.icon;
                          return (
                            <motion.div key={item.title} variants={staggerItem} custom={index}>
                              <SidebarMenuItem>
                                <SidebarMenuButton
                                  asChild
                                  className={cn(
                                    "h-8 px-2 hover:bg-sidebar-accent/50 rounded-md group/item",
                                    item.isActive && "bg-sidebar-accent"
                                  )}
                                >
                                  <Link to={item.url} className="flex items-center gap-2">
                                    <motion.div
                                      whileHover={{ scale: 1.1, rotate: 5 }}
                                      transition={{ type: "spring", stiffness: 300 }}
                                    >
                                      {Icon && <Icon className="size-4 text-muted-foreground" />}
                                    </motion.div>
                                    <span className="text-sm flex-1 truncate">{item.title}</span>
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            </motion.div>
                          );
                        })
                      )}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </>
              ) : (
                <Collapsible
                  defaultOpen
                  className="group/collapsible"
                >
                  <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="hover:bg-sidebar-accent rounded-md py-0 px-2 flex items-center w-full transition-colors group/trigger">
                      <motion.div
                        animate={{ rotate: "90deg" }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="size-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 mr-1.5" />
                      </motion.div>
                      <span className="text-xs font-medium text-muted-foreground flex-1 text-left">Classi</span>
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <motion.div
                    className="opacity-0 group-hover/collapsible:opacity-100 transition-opacity"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <SidebarGroupAction
                      onClick={() => setAddClassDialogOpen(true)}
                    >
                      <Plus className="size-3.5" />
                    </SidebarGroupAction>
                  </motion.div>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenuSub className="gap-0.5 pt-1 pr-1">
                        {data.classes.length === 0 ? (
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className="text-muted-foreground"
                              onClick={() => setAddClassDialogOpen(true)}
                            >
                              <Plus className="size-3.5" />
                              <span>Aggiungi classe</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ) : (
                          data.classes.map((item, index) => (
                            <motion.div key={item.title} variants={staggerItem} custom={index}>
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={item.isActive}
                                >
                                  <Link to={item.url} className="flex items-center gap-2">
                                    <motion.div
                                      whileHover={{ scale: 1.1, rotate: 5 }}
                                      transition={{ type: "spring", stiffness: 300 }}
                                    >
                                      {item.icon && (
                                        <item.icon className="size-3.5 text-muted-foreground" />
                                      )}
                                    </motion.div>
                                    <span className="truncate">{item.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            </motion.div>
                          ))
                        )}
                      </SidebarMenuSub>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </motion.div>
          </SidebarGroup>


          <SidebarGroup className="py-2">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <SidebarGroupLabel>Gestione</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  <motion.div variants={staggerItem}>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        className="h-8 px-2 hover:bg-sidebar-accent/50 rounded-md"
                      >
                        <Link to="/students" className="flex items-center gap-2">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <Users className="size-4 text-muted-foreground" />
                          </motion.div>
                          <span className="text-sm">Tutti gli Studenti</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </motion.div>

                </SidebarMenu>
              </SidebarGroupContent>
            </motion.div>
          </SidebarGroup>

        </SidebarContent>



        <SidebarFooter className="border-t border-sidebar-border">
          {client.UserModel?.user && <NavUser user={client.UserModel.user} />}
        </SidebarFooter>

        <SidebarRail />

      </Sidebar>

      {/* Add Class Dialog */}
      <AddClassDialog
        open={addClassDialogOpen}
        onOpenChange={setAddClassDialogOpen}
        onClassAdded={refreshClasses}
      />
    </>
  )
}
