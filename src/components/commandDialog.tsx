import * as React from "react"
import {
    User,
    Archive,
} from "lucide-react"
import { MdDesk } from "react-icons/md"
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
                                className="cursor-pointer"
                            >
                                <MdDesk className="size-4" />
                                <span>{cls.className}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                    {archivedClasses.length > 0 && (
                        <CommandGroup heading="Classi Archiviate (Storico)">
                            {archivedClasses.map((cls) => (
                                <CommandItem
                                    key={cls.id}
                                    value={`${cls.className} ${cls.schoolYear} archiviata archivio storico`}
                                    onSelect={() => handleSelectClass(cls.id)}
                                    className="cursor-pointer"
                                >
                                    <Archive className="size-4 text-amber-600 dark:text-amber-400" />
                                    <span className="flex-1 font-medium">{cls.className}</span>
                                    <span className="text-xs text-muted-foreground mr-2">{cls.schoolYear}</span>
                                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300/40">
                                        Archiviata
                                    </span>
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
                                className="cursor-pointer"
                            >
                                <User className="size-4" />
                                <span>{student.firstName} {student.lastName}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    )
}
