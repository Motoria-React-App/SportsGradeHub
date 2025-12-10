import * as React from "react"
import {
    User,
} from "lucide-react"
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "./ui/command"
import { Student, SchoolClass } from "@/types/types";
import { Spinner } from "./ui/spinner";
import { useClient } from "@/provider/clientProvider";
import { useCommandDialog } from "@/provider/commandDialogProvider";



export function CommandDialogDemo() {
    // Use global state from context
    const { open, setOpen } = useCommandDialog()

    const [students, setStudents] = React.useState<Student[] | null>(null)
    const [classes, setClasses] = React.useState<SchoolClass[] | null>(null)
    const [error, setError] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    const client = useClient();

    const getStudents = React.useCallback(async () => {
        try {
            setIsLoading(true);

            let res = await client.getStudents();
            let classes = await client.getClasses();

            setStudents(res.data);
            setClasses(classes.data);

            setIsLoading(false);

            return { res, classes }

        } catch (error) {
            setIsLoading(false);
            setError(true);
        }
    }, [client]);

    // Fetch data when dialog opens
    React.useEffect(() => {
        if (open && !students && !isLoading) {
            getStudents();
        }
    }, [open, students, isLoading, getStudents]);

    // Keyboard shortcut
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "j" && (e.metaKey || e.altKey)) {
                e.preventDefault()
                setOpen((prev) => !prev)
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [setOpen])

    return (
        <>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Search a student or class" />
                <CommandList>
                    {isLoading && <CommandEmpty><Spinner /></CommandEmpty>}
                    {error && <CommandEmpty>Error loading data</CommandEmpty>}
                    {classes && students && (
                        <>
                            <CommandGroup heading="Classes">
                                {classes.map((cls) => (
                                    <CommandItem key={cls.id}>
                                        <User />
                                        <span>{cls.className}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            <CommandGroup heading="Students">
                                {students.map((student) => (
                                    <CommandItem key={student.id}>
                                        <User />
                                        <span>{student.firstName + " " + student.lastName}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    )
}
