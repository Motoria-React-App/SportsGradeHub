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
  SidebarGroupAction,
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
  FileText,
  Plus,
  Activity,
  Users,
  ClipboardCheck,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCommandDialog } from "@/provider/commandDialogProvider"
import { Link } from "react-router-dom"
import { AddClassDialog } from "./add-class-dialog"
import { Kbd, KbdGroup } from "./ui/kbd"
import { useSettings } from "@/provider/settingsProvider"

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
            {!settings.collapsibleClasses ? (
              <>
                <SidebarGroupLabel className="px-2 flex items-center w-full transition-colors group/label relative">
                  <span className="text-xs font-medium text-muted-foreground flex-1 text-left">Classi</span>
                  <SidebarGroupAction
                    className="opacity-0 group-hover/label:opacity-100 transition-opacity relative top-0 right-0"
                    onClick={() => setAddClassDialogOpen(true)}
                  >
                    <Plus className="size-3.5" />
                  </SidebarGroupAction>
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0.5 pt-1">
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
                      data.classes.map((item) => {
                        const Icon = item.icon;
                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                              asChild
                              className={cn(
                                "h-8 px-2 hover:bg-sidebar-accent/50 rounded-md group/item",
                                item.isActive && "bg-sidebar-accent"
                              )}
                            >
                              <Link to={item.url} className="flex items-center gap-2">
                                {Icon && <Icon className="size-4 text-muted-foreground" />}
                                <span className="text-sm flex-1 truncate">{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
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
                    <ChevronRight className="size-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 mr-1.5" />
                    <span className="text-xs font-medium text-muted-foreground flex-1 text-left">Classi</span>
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <SidebarGroupAction
                  className="opacity-0 group-hover/collapsible:opacity-100 transition-opacity"
                  onClick={() => setAddClassDialogOpen(true)}
                >
                  <Plus className="size-3.5" />
                </SidebarGroupAction>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu className="gap-0.5 pt-1">
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
                                "h-8 px-2 hover:bg-sidebar-accent/50 rounded-md group/item ml-2 border-l border-sidebar-border/50",
                                item.isActive && "bg-sidebar-accent border-sidebar-primary/50"
                              )}
                            >
                              <Link to={item.url} className="flex items-center gap-2">
                                {/* {item.icon && (
                                  <item.icon className="size-3.5 text-muted-foreground" />
                                )} */}
                                <span className="text-sm flex-1 truncate">{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))
                      )}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            )}
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

              </SidebarMenu>
            </SidebarGroupContent>
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
