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
import { useNavigate } from "react-router-dom";



export function CommandDialogDemo() {
    // Use global state from context
    const { open, setOpen } = useCommandDialog()
    const navigate = useNavigate();

    const [students, setStudents] = React.useState<Student[] | null>(null)
    const [archivedClasses, setArchivedClasses] = React.useState<SchoolClass[] | null>(null)
    const [nonArchivedClasses, setNonArchivedClasses] = React.useState<SchoolClass[] | null>(null)
    const [error, setError] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    const client = useClient();

    const getStudents = React.useCallback(async () => {
        try {
            setIsLoading(true);

            let res = await client.getStudents();
            let archivedClasses = await client.getArchivedClasses();
            let nonArchivedClasses = await client.getNonArchivedClasses();

            setStudents(res.data);
            setArchivedClasses(archivedClasses.data);
            setNonArchivedClasses(nonArchivedClasses.data);

            setIsLoading(false);

            return { res, archivedClasses, nonArchivedClasses }

        } catch (error) {
            setIsLoading(false);
            setError(true);
        }
    }, [client]);

    // Fetch data every time dialog opens
    React.useEffect(() => {
        if (open) {
            getStudents();
        }
    }, [open, getStudents]);

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
                    {isLoading && <CommandEmpty><Spinner /></CommandEmpty>}
                    {error && <CommandEmpty>Errore caricamento dati</CommandEmpty>}
                    {nonArchivedClasses && students && archivedClasses && (
                        <>
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
                        </>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    )
}

