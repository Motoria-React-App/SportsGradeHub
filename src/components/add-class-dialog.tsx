import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Plus, Trash2, Users } from "lucide-react"
import { Gender } from "@/types/types"
import { useClient } from "@/provider/clientProvider"
import { useTranslation } from "@/hooks/useTranslation"

interface StudentEntry {
    id: string
    firstName: string
    lastName: string
    gender?: Gender
}

interface AddClassDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onClassAdded?: () => void
}

export function AddClassDialog({ open, onOpenChange, onClassAdded }: AddClassDialogProps) {
    const { t } = useTranslation()
    const [isLoading, setIsLoading] = React.useState(false)
    const [studentInputMode, setStudentInputMode] = React.useState<"manual" | "raw">("manual")

    const client = useClient();

    const [formData, setFormData] = React.useState({
        className: "",
        schoolYear: "",
    })

    const [students, setStudents] = React.useState<StudentEntry[]>([])
    const [rawStudentsText, setRawStudentsText] = React.useState("")

    // Generate unique ID for student entries
    const generateId = () => Math.random().toString(36).substring(2, 9)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    // Add a new empty student row
    const addStudent = () => {
        setStudents(prev => [...prev, {
            id: generateId(),
            firstName: "",
            lastName: "",
            gender: "M" as Gender
        }])
    }

    // Remove a student by id
    const removeStudent = (id: string) => {
        setStudents(prev => prev.filter(s => s.id !== id))
    }

    // Update a specific student field
    const updateStudent = (id: string, field: keyof StudentEntry, value: string) => {
        setStudents(prev => prev.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        ))
    }

    // Parse raw text into students
    // Format: "nome; cognome; M/F" per line (gender is optional)
    const parseRawStudents = (): StudentEntry[] => {
        const lines = rawStudentsText.trim().split("\n").filter(line => line.trim())
        return lines.map(line => {
            const parts = line.trim().split(";").map(p => p.trim())

            const firstName = parts[0] || ""
            const lastName = parts[1] || ""
            const genderPart = parts[2]?.toUpperCase()

            // Determine gender (undefined if not specified)
            let gender: Gender | undefined = undefined
            if (genderPart === "F" || genderPart === "FEMMINA" || genderPart === "FEMALE") gender = "F"
            else if (genderPart === "M" || genderPart === "MASCHIO" || genderPart === "MALE") gender = "M"

            return {
                id: generateId(),
                firstName,
                lastName,
                ...(gender && { gender })
            }
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.className.trim()) {
            toast.error(t("dialogs.addClass.className"))
            return
        }

        if (!formData.schoolYear.trim()) {
            toast.error(t("dialogs.addClass.schoolYear"))
            return
        }

        // Get students based on input mode
        const finalStudents = studentInputMode === "manual"
            ? students.filter(s => s.firstName.trim() || s.lastName.trim())
            : parseRawStudents()

        // Validate students have at least first or last name
        const invalidStudents = finalStudents.filter(s => !s.firstName.trim() && !s.lastName.trim())
        if (invalidStudents.length > 0) {
            toast.error(t("common.error"))
            return
        }

        try {
            setIsLoading(true)

            const res = await client.createClass({
                className: formData.className,
                schoolYear: formData.schoolYear,
                students: finalStudents
            })

            const studentCount = finalStudents.length

            if (res.success) {
                toast.success(
                    `Classe "${formData.className}" creata con successo!` +
                    (studentCount > 0 ? ` (${studentCount} studenti)` : "")
                )
            } else {
                toast.error(t("common.error"))
                throw new Error(res.error?.message);
            }

            // Reset form
            setFormData({ className: "", schoolYear: "" })
            setStudents([])
            setRawStudentsText("")

            // Close dialog
            onOpenChange(false)

            // Callback to refresh class list
            onClassAdded?.()

        } catch (error) {
            toast.error(t("common.error"))
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    // Generate current school year suggestion (e.g., "2024/2025")
    const getCurrentSchoolYear = () => {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + 1 // 0-indexed

        // If we're before September, we're in the previous school year
        if (month < 9) {
            return `${year - 1}/${year}`
        }
        return `${year}/${year + 1}`
    }

    // Set default school year when dialog opens
    React.useEffect(() => {
        if (open && !formData.schoolYear) {
            setFormData(prev => ({ ...prev, schoolYear: getCurrentSchoolYear() }))
        }
    }, [open])

    // Reset form when dialog closes
    React.useEffect(() => {
        if (!open) {
            setFormData({ className: "", schoolYear: "" })
            setStudents([])
            setRawStudentsText("")
            setStudentInputMode("manual")
        }
    }, [open])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t("dialogs.addClass.title")}</DialogTitle>
                    <DialogDescription>
                        {t("dialogs.addClass.desc")}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Class Info Section */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="className">{t("classes.title")}</Label>
                                <Input
                                    id="className"
                                    name="className"
                                    placeholder={t("dialogs.addClass.className")}
                                    value={formData.className}
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                    autoFocus
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="schoolYear">{t("classes.schoolYear")}</Label>
                                <Input
                                    id="schoolYear"
                                    name="schoolYear"
                                    placeholder={t("dialogs.addClass.schoolYear")}
                                    value={formData.schoolYear}
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Students Section */}
                        <div className="grid gap-2 mt-2">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2">
                                    <Users className="size-4" />
                                    {t("students.title")}
                                </Label>
                                <span className="text-xs text-muted-foreground">
                                    {studentInputMode === "manual"
                                        ? `${students.filter(s => s.firstName || s.lastName).length} ${t("dashboard.studentsCount")}`
                                        : `${rawStudentsText.trim().split("\n").filter(l => l.trim()).length} lines`
                                    }
                                </span>
                            </div>

                            <Tabs value={studentInputMode} onValueChange={(v) => setStudentInputMode(v as "manual" | "raw")}>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="manual">{t("dialogs.addClass.manualMode")}</TabsTrigger>
                                    <TabsTrigger value="raw">{t("dialogs.addClass.rawMode")}</TabsTrigger>
                                </TabsList>

                                {/* Manual Entry Tab */}
                                <TabsContent value="manual" className="mt-3">
                                    <div className="space-y-2">
                                        {students.map((student, index) => (
                                            <div key={student.id} className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground w-5">{index + 1}.</span>
                                                <Input
                                                    placeholder={t("students.firstName")}
                                                    value={student.firstName}
                                                    onChange={(e) => updateStudent(student.id, "firstName", e.target.value)}
                                                    disabled={isLoading}
                                                    className="flex-1"
                                                />
                                                <Input
                                                    placeholder={t("students.lastName")}
                                                    value={student.lastName}
                                                    onChange={(e) => updateStudent(student.id, "lastName", e.target.value)}
                                                    disabled={isLoading}
                                                    className="flex-1"
                                                />
                                                <Select
                                                    value={student.gender}
                                                    onValueChange={(v) => updateStudent(student.id, "gender", v)}
                                                    disabled={isLoading}
                                                >
                                                    <SelectTrigger className="w-20">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="M">M</SelectItem>
                                                        <SelectItem value="F">F</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeStudent(student.id)}
                                                    disabled={isLoading}
                                                    className="shrink-0 text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        ))}

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addStudent}
                                            disabled={isLoading}
                                            className="w-full mt-2"
                                        >
                                            <Plus className="size-4 mr-2" />
                                            {t("dialogs.addClass.addStudentRow")}
                                        </Button>
                                    </div>
                                </TabsContent>

                                {/* Raw Text Tab */}
                                <TabsContent value="raw" className="mt-3">
                                    <div className="space-y-2">
                                        <Textarea
                                            placeholder={t("dialogs.addClass.rawPlaceholder")}
                                            value={rawStudentsText}
                                            onChange={(e) => setRawStudentsText(e.target.value)}
                                            disabled={isLoading}
                                            rows={8}
                                            className="font-mono text-sm"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {t("dialogs.addClass.rawHint")}
                                        </p>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            {t("common.cancel")}
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? t("dialogs.addClass.creating") : t("dialogs.addClass.createBtn")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
