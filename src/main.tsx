import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ClientProvider } from './provider/clientProvider'
import { SettingsProvider } from './provider/settingsProvider'
import { ScheduleProvider } from './provider/scheduleProvider'
import { CommandDialogProvider } from './provider/commandDialogProvider'
import { ThemeProvider } from "./components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme-v2">
      <ClientProvider>
        <SettingsProvider>
          <ScheduleProvider>
            <CommandDialogProvider>
              <App />
              <Toaster />
            </CommandDialogProvider>
          </ScheduleProvider>
        </SettingsProvider>
      </ClientProvider>
    </ThemeProvider>
  </StrictMode>,
)

