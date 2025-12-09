import * as React from "react"

interface CommandDialogContextType {
    open: boolean
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
    openCommandDialog: () => void
    closeCommandDialog: () => void
    toggleCommandDialog: () => void
}

const CommandDialogContext = React.createContext<CommandDialogContextType | undefined>(undefined)

export function CommandDialogProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false)

    const openCommandDialog = React.useCallback(() => setOpen(true), [])
    const closeCommandDialog = React.useCallback(() => setOpen(false), [])
    const toggleCommandDialog = React.useCallback(() => setOpen((prev) => !prev), [])

    const value = React.useMemo(
        () => ({
            open,
            setOpen,
            openCommandDialog,
            closeCommandDialog,
            toggleCommandDialog,
        }),
        [open, openCommandDialog, closeCommandDialog, toggleCommandDialog]
    )

    return (
        <CommandDialogContext.Provider value={value}>
            {children}
        </CommandDialogContext.Provider>
    )
}

export function useCommandDialog() {
    const context = React.useContext(CommandDialogContext)
    if (context === undefined) {
        throw new Error("useCommandDialog must be used within a CommandDialogProvider")
    }
    return context
}
