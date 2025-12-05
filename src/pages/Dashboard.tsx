
import { AppSidebar } from "@/components/app-sidebar"

import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"



export default function Dashboard() {

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >

            <AppSidebar variant="inset" />
            <SidebarInset>

                


            </SidebarInset>
        </SidebarProvider>
    )
}
