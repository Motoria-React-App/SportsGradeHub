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
import { useClient, useSchoolData } from "@/provider/clientProvider"
import { toast } from "sonner"
import { Student, Gender } from "@/types/types"

interface StudentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    student?: Student | null // If provided, we're in edit mode
    defaultClassId?: string // If provided, pre-select this class (useful when adding from class page)
    onSuccess?: () => void // Callback after successful add/edit
}

export function StudentDialog({ 
    open, 
    onOpenChange, 
    student, 
    defaultClassId,
    onSuccess 
}: StudentDialogProps) {
    const client = useClient()
    const { classes, refreshStudents } = useSchoolData()
    const [isLoading, setIsLoading] = React.useState(false)

    const isEditMode = !!student

    const [formData, setFormData] = React.useState({
        firstName: "",
        lastName: "",
        gender: "M" as Gender,
        birthdate: "",
        notes: "",
        currentClassId: "",
    })

    // Initialize form when dialog opens or student changes
    React.useEffect(() => {
        if (open) {
            if (student) {
                // Edit mode: populate with student data
                setFormData({
                    firstName: student.firstName || "",
                    lastName: student.lastName || "",
                    gender: student.gender || "M",
                    birthdate: student.birthdate || "",
                    notes: student.notes || "",
                    currentClassId: student.currentClassId || "",
                })
            } else {
                // Add mode: reset form, use defaultClassId if provided
                setFormData({
                    firstName: "",
                    lastName: "",
                    gender: "M",
                    birthdate: "",
                    notes: "",
                    currentClassId: defaultClassId || "",
                })
            }
        }
    }, [open, student, defaultClassId])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.firstName.trim()) {
            toast.error("Il nome è obbligatorio")
            return
        }

        if (!formData.lastName.trim()) {
            toast.error("Il cognome è obbligatorio")
            return
        }

        if (!formData.currentClassId) {
            toast.error("Seleziona una classe")
            return
        }

        try {
            setIsLoading(true)

            if (isEditMode && student) {
                // Update existing student
                const res = await client.updateStudent(student.id, {
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    gender: formData.gender,
                    birthdate: formData.birthdate || undefined,
                    notes: formData.notes || undefined,
                    currentClassId: formData.currentClassId,
                })

                if (res.success) {
                    toast.success(`Studente "${formData.firstName} ${formData.lastName}" modificato con successo!`)
                } else {
                    throw new Error(res.error?.message || "Errore sconosciuto")
                }
            } else {
                // Create new student
                const res = await client.createStudent({
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    gender: formData.gender,
                    birthdate: formData.birthdate || undefined,
                    notes: formData.notes || undefined,
                    currentClassId: formData.currentClassId,
                    justifiedDays: [],
                    classHistory: [],
                })

                if (res.success) {
                    toast.success(`Studente "${formData.firstName} ${formData.lastName}" aggiunto con successo!`)
                } else {
                    throw new Error(res.error?.message || "Errore sconosciuto")
                }
            }

            // Refresh data
            await refreshStudents()
            
            // Close dialog
            onOpenChange(false)

            // Callback
            onSuccess?.()

        } catch (error) {
            toast.error(isEditMode ? "Errore durante la modifica" : "Errore durante la creazione")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditMode ? "Modifica Studente" : "Nuovo Studente"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditMode 
                            ? "Modifica i dati dello studente." 
                            : "Inserisci i dati del nuovo studente."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Nome e Cognome */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="firstName">Nome *</Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    placeholder="Mario"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                    autoFocus
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="lastName">Cognome *</Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    placeholder="Rossi"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Sesso e Data di Nascita */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="gender">Sesso *</Label>
                                <Select
                                    value={formData.gender}
                                    onValueChange={(v) => setFormData(prev => ({ ...prev, gender: v as Gender }))}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger id="gender">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="M">Maschio</SelectItem>
                                        <SelectItem value="F">Femmina</SelectItem>
                                        <SelectItem value="N">Non specificato</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="birthdate">Data di Nascita</Label>
                                <Input
                                    id="birthdate"
                                    name="birthdate"
                                    type="date"
                                    value={formData.birthdate}
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Classe */}
                        <div className="grid gap-2">
                            <Label htmlFor="currentClassId">Classe *</Label>
                            <Select
                                value={formData.currentClassId}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, currentClassId: v }))}
                                disabled={isLoading}
                            >
                                <SelectTrigger id="currentClassId">
                                    <SelectValue placeholder="Seleziona una classe" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.id}>
                                            {cls.className} ({cls.schoolYear})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Note */}
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Note</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                placeholder="Eventuali note sullo studente..."
                                value={formData.notes}
                                onChange={handleInputChange}
                                disabled={isLoading}
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Annulla
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading 
                                ? (isEditMode ? "Salvataggio..." : "Creazione...") 
                                : (isEditMode ? "Salva Modifiche" : "Crea Studente")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
