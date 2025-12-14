import * as React from "react"
import {
  IconInnerShadowTop,
} from "@tabler/icons-react"

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
} from "@/components/ui/sidebar"

import { NavUser } from "./nav-user"
import { useClient } from "@/provider/clientProvider"
import { SchoolClass } from "@/types/types"
import {
  Home,
  Search,
  FileText,
  Plus,
  Activity,
  BarChart3,
  Users,
  LogOut,
  Settings,
  ClipboardCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCommandDialog } from "@/provider/commandDialogProvider"
import { Link } from "react-router-dom"
import { AddClassDialog } from "./add-class-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Kbd, KbdGroup } from "./ui/kbd"

// Types
type NavItemType = {
  title: string
  url: string
  icon?: React.ComponentType<{ className?: string }>
  isActive?: boolean
}


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const client = useClient();
  const { openCommandDialog } = useCommandDialog();
  const [classes, setClasses] = React.useState<SchoolClass[]>([]);
  const [addClassDialogOpen, setAddClassDialogOpen] = React.useState(false);

  const fetchClasses = React.useCallback(async () => {
    const response = await client.getClasses();
    if (response.success && response.data) {
      setClasses(response.data);
    }
  }, [client]);

  React.useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const data = {
    user: {
      name: "Professor",
      email: "prof@school.com",
      avatar: "/avatars/user.jpg",
    },
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
      {
        title: "Analytics",
        url: "/analytics",
        icon: BarChart3,
      },
      {
        title: "Valutazioni",
        url: "/valutazioni/all/all",
        icon: ClipboardCheck,
      },
    ],
    classes: classes.map((item: SchoolClass) => ({
      title: item.className,
      url: `/classes/${item.id}`,
      icon: FileText,
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
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                    <IconInnerShadowTop className="size-4" />
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
            <SidebarMenu className="gap-0.5">
              {data.quickNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.onClick ? (
                    <SidebarMenuButton
                      onClick={item.onClick}
                      className="h-8 px-2 hover:bg-sidebar-accent/50 rounded-md flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        {item.icon && (
                          <item.icon className="size-4 text-muted-foreground" />
                        )}
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
                        {item.icon && (
                          <item.icon className="size-4 text-muted-foreground" />
                        )}
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>


          <SidebarGroup className="py-2">
            <SidebarGroupLabel className="h-8 px-2 text-xs font-medium text-muted-foreground flex items-center justify-between group/label">
              <span>Classi</span>
              <div className="flex gap-1 opacity-0 group-hover/label:opacity-100 transition-opacity">
                {/* <button className="p-1 hover:bg-sidebar-accent rounded">
                <MoreHorizontal className="size-3.5 text-muted-foreground" />
              </button> */}
                <button
                  className="p-1 hover:bg-sidebar-accent rounded"
                  onClick={() => setAddClassDialogOpen(true)}
                >
                  <Plus className="size-3.5 text-muted-foreground" />
                </button>
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {data.classes.length === 0 ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className="h-8 px-2 text-muted-foreground hover:bg-sidebar-accent/50 rounded-md"
                      onClick={() => setAddClassDialogOpen(true)}
                    >
                      <Plus className="size-4" />
                      <span className="text-sm">Aggiungi classe</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : (
                  data.classes.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={cn(
                          "h-8 px-2 hover:bg-sidebar-accent/50 rounded-md group/item",
                          item.isActive && "bg-sidebar-accent"
                        )}
                      >
                        <Link to={item.url} className="flex items-center gap-2">
                          {item.icon && (
                            <item.icon className="size-4 text-muted-foreground" />
                          )}
                          <span className="text-sm flex-1 truncate">{item.title}</span>
                          {/* <MoreHorizontal className="size-3.5 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity" /> */}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>


          <SidebarGroup className="py-2">
            <SidebarGroupLabel>Gestione</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="h-8 px-2 hover:bg-sidebar-accent/50 rounded-md"
                  >
                    <Link to="/students" className="flex items-center gap-2">
                      <Users className="size-4 text-muted-foreground" />
                      <span className="text-sm">Tutti gli Studenti</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="h-8 px-2 hover:bg-sidebar-accent/50 rounded-md"
                  >
                    <Link to="/settings" className="flex items-center gap-2">
                      <Settings className="size-4 text-muted-foreground" />
                      <span className="text-sm">Impostazioni</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

        </SidebarContent>

        {client.isRefreshTokenNearExpiry(52) && (
          <Card className="gap-4 py-4 m-2 shadow-none">
            <CardHeader className="px-4">
              <CardTitle className="text-sm">Scadenza Sessione</CardTitle>
              <CardDescription>
                La tua sessione scade il {client.getRefreshTokenExpiration()?.toLocaleDateString() || "Non disponibile"} <br />
                Per una maggiore sicurezza, dovrai rieffettuare il Login
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4">
              <Button
                onClick={() => client.logout()}
                className="w-full cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>

            </CardContent>
          </Card>
        )
        }

        <SidebarFooter className="border-t border-sidebar-border">

          <NavUser user={data.user} />
        </SidebarFooter>

        <SidebarRail />

      </Sidebar>

      {/* Add Class Dialog */}
      <AddClassDialog
        open={addClassDialogOpen}
        onOpenChange={setAddClassDialogOpen}
        onClassAdded={fetchClasses}
      />
    </>
  )
}
