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
import { Student } from "@/types";
import { SchoolClass } from "@/types/types";



export function CommandDialogDemo() {
    const [open, setOpen] = React.useState(false)

    const [students, setStudents] = React.useState<Student[]>([])
    const [classes, setClasses] = React.useState<SchoolClass[]>([])

    async function getStudents() {

        const apiKey = import.meta.env.VITE_API_KEY || "";  // ← QUI

        const res = await fetch("http://localhost:3000/api/students", {
            method: "GET",
            mode: "cors",
            headers: {
                'Content-Type': 'application/json',
                "X-API-Key": apiKey
            },
        })
        const data: Student[] = await res.json();

        const resp = await fetch("http://localhost:3000/api/classes", {
            method: "GET",
            mode: "cors",
            headers: {
                'Content-Type': 'application/json',
                "X-API-Key": apiKey
            },
        })
        const classes: SchoolClass[] = await resp.json();


        return { data, classes }

    }

    React.useEffect(() => {
        const down = async (e: KeyboardEvent) => {
            if (e.key === "j" && (e.metaKey || e.altKey)) {
                e.preventDefault()
                setOpen((open) => !open)

                // Fetch students when opening the dialog
                const studentsData = await getStudents();
                setStudents(studentsData.data);
                setClasses(studentsData.classes);
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    return (
        <>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Search a student or class" />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
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
                </CommandList>
            </CommandDialog>
        </>
    )
}
