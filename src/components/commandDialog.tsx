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
import { useSchoolData } from "@/provider/clientProvider";
import { useCommandDialog } from "@/provider/commandDialogProvider";
import { useNavigate } from "react-router-dom";



export function CommandDialogDemo() {
    // Use global state from context
    const { open, setOpen } = useCommandDialog()
    const navigate = useNavigate();

    // Read data already loaded by ClientProvider — no extra API calls needed
    const { students, classes } = useSchoolData();

    const nonArchivedClasses = React.useMemo(
        () => classes.filter(c => !c.isArchived),
        [classes]
    );
    const archivedClasses = React.useMemo(
        () => classes.filter(c => c.isArchived),
        [classes]
    );

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

    const handleSelectClass = (classId: string) => {
        setOpen(false);
        navigate(`/classes/${classId}`);
    };

    const handleSelectStudent = (studentId: string) => {
        setOpen(false);
        navigate(`/students/${studentId}`);
    };

    return (
        <>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Cerca studente o classe..." />
                <CommandList>
                    {students.length === 0 && classes.length === 0 && (
                        <CommandEmpty>Nessun risultato trovato</CommandEmpty>
                    )}
                    <CommandGroup heading="Classi">
                        {nonArchivedClasses.map((cls) => (
                            <CommandItem
                                key={cls.id}
                                value={`${cls.className} ${cls.createdAt}`}
                                onSelect={() => handleSelectClass(cls.id)}
                            >
                                <User />
                                <span>{cls.className}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                    {archivedClasses.length > 0 && (
                        <CommandGroup heading="Classi Archiviate">
                            {archivedClasses.map((cls) => (
                                <CommandItem
                                    key={cls.id}
                                    value={`${cls.className} ${cls.createdAt}`}
                                    onSelect={() => handleSelectClass(cls.id)}
                                >
                                    <User />
                                    <span>{cls.className}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                    <CommandGroup heading="Studenti">
                        {students.map((student) => (
                            <CommandItem
                                key={student.id}
                                value={`${student.firstName} ${student.lastName}`}
                                onSelect={() => handleSelectStudent(student.id)}
                            >
                                <User />
                                <span>{student.firstName} {student.lastName}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    )
}
