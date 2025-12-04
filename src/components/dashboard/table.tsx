import { DataTable } from "../data-table"
import { getStudentsByClass } from "@/data/mockData"
import type { Student } from "@/types"

interface TableCompProps {
    classId: string
}

export default function TableComp({ classId }: TableCompProps) {
    const students: Student[] = getStudentsByClass(classId)

    return (
        <DataTable data={students} />
    )
}