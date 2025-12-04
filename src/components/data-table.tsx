"use client"

import * as React from "react"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconLayoutColumns,
  IconPlus,
  IconSearch,
  IconTrendingUp,
  IconTrendingDown,
  IconEdit,
  IconX,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Student, Grade, Exercise } from "@/types"
import { getGradesByStudent, exercises } from "@/data/mockData"
import { toast } from "sonner"

function getPerformanceBadge(level: string) {
  const config = {
    'excellent': { label: 'Eccellente', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    'good': { label: 'Buono', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    'average': { label: 'Sufficiente', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    'needs-improvement': { label: 'Da migliorare', className: 'bg-red-500/10 text-red-600 border-red-500/20' },
  }
  return config[level as keyof typeof config] || config['average']
}

// Chart configuration
const chartConfig = {
  grade: {
    label: "Voto",
    color: "#3b82f6",
  },
} satisfies ChartConfig

// Student Detail Panel Component
function StudentDetailPanel({
  student,
  isOpen,
  onClose,
}: {
  student: Student | null
  isOpen: boolean
  onClose: () => void
}) {
  const [editedStudent, setEditedStudent] = React.useState<Partial<Student>>({})
  const [newGrade, setNewGrade] = React.useState({
    exerciseId: '',
    technical: '',
    effort: '',
    teamwork: '',
    overall: '',
    notes: '',
  })

  React.useEffect(() => {
    if (student) {
      setEditedStudent({
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
      })
    }
  }, [student])

  const grades = student ? getGradesByStudent(student.id) : []
  
  // Prepare chart data - group grades by month
  const chartData = React.useMemo(() => {
    if (!student) return []
    const monthlyGrades: { [key: string]: { total: number; count: number } } = {}
    
    grades.forEach((grade) => {
      const date = new Date(grade.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyGrades[monthKey]) {
        monthlyGrades[monthKey] = { total: 0, count: 0 }
      }
      monthlyGrades[monthKey].total += grade.finalGrade
      monthlyGrades[monthKey].count += 1
    })

    return Object.entries(monthlyGrades)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }),
        grade: parseFloat((data.total / data.count).toFixed(1)),
      }))
  }, [grades, student])

  const handleSaveStudent = () => {
    toast.success('Dati studente salvati con successo!')
  }

  const handleAddGrade = () => {
    if (!newGrade.exerciseId || !newGrade.technical || !newGrade.effort || !newGrade.overall) {
      toast.error('Compila tutti i campi obbligatori')
      return
    }
    toast.success('Voto aggiunto con successo!')
    setNewGrade({
      exerciseId: '',
      technical: '',
      effort: '',
      teamwork: '',
      overall: '',
      notes: '',
    })
  }

  const selectedExercise = exercises.find(e => e.id === newGrade.exerciseId)

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6">
            {student ? (
              <div className="flex flex-col gap-4">
            <SheetHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary">
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
                  <div>
                    <SheetTitle className="text-xl">{student.fullName}</SheetTitle>
                    <SheetDescription>{student.className} • {student.email}</SheetDescription>
                  </div>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-primary">{student.averageGrade.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">Media</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{student.totalGrades}</div>
                  <div className="text-xs text-muted-foreground">Valutazioni</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${student.trends.improving ? 'text-emerald-500' : 'text-red-500'}`}>
                    {student.trends.improving ? <IconTrendingUp className="size-5" /> : <IconTrendingDown className="size-5" />}
                    {Math.abs(student.trends.percentageChange)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Trend</div>
                </div>
              </div>
            </SheetHeader>

            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="overview">Panoramica</TabsTrigger>
                <TabsTrigger value="add-grade">Nuovo Voto</TabsTrigger>
                <TabsTrigger value="edit">Modifica</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                {/* Performance Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Andamento Voti</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {chartData.length > 1 ? (
                      <ChartContainer config={chartConfig} className="h-48 w-full">
                        <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                          <XAxis 
                            dataKey="month" 
                            tickLine={false} 
                            axisLine={false} 
                            tickMargin={8}
                            className="text-xs"
                          />
                          <YAxis 
                            domain={[4, 10]} 
                            tickLine={false} 
                            axisLine={false}
                            tickMargin={8}
                            className="text-xs"
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line
                            type="monotone"
                            dataKey="grade"
                            stroke="var(--color-grade)"
                            strokeWidth={2}
                            dot={{ fill: "var(--color-grade)", r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ChartContainer>
                    ) : (
                      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                        Non ci sono abbastanza dati per mostrare il grafico
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Grades */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Ultimi Voti</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {grades.slice(0, 5).map((grade) => (
                      <div key={grade.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{grade.exerciseName}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(grade.date).toLocaleDateString('it-IT')}
                          </span>
                        </div>
                        <Badge variant={grade.finalGrade >= 6 ? "default" : "destructive"} className="text-sm">
                          {grade.finalGrade.toFixed(1)}
                        </Badge>
                      </div>
                    ))}
                    {grades.length === 0 && (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        Nessun voto registrato
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Add Grade Tab */}
              <TabsContent value="add-grade" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Aggiungi Nuovo Voto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="exercise">Esercizio *</Label>
                      <Select 
                        value={newGrade.exerciseId} 
                        onValueChange={(value) => setNewGrade({ ...newGrade, exerciseId: value })}
                      >
                        <SelectTrigger id="exercise">
                          <SelectValue placeholder="Seleziona esercizio" />
                        </SelectTrigger>
                        <SelectContent>
                          {exercises.map((ex) => (
                            <SelectItem key={ex.id} value={ex.id}>
                              {ex.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="technical">Tecnica * (1-10)</Label>
                        <Input
                          id="technical"
                          type="number"
                          min="1"
                          max="10"
                          value={newGrade.technical}
                          onChange={(e) => setNewGrade({ ...newGrade, technical: e.target.value })}
                          placeholder="1-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="effort">Impegno * (1-10)</Label>
                        <Input
                          id="effort"
                          type="number"
                          min="1"
                          max="10"
                          value={newGrade.effort}
                          onChange={(e) => setNewGrade({ ...newGrade, effort: e.target.value })}
                          placeholder="1-10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {selectedExercise?.requiresTeamwork && (
                        <div className="space-y-2">
                          <Label htmlFor="teamwork">Lavoro di Squadra (1-10)</Label>
                          <Input
                            id="teamwork"
                            type="number"
                            min="1"
                            max="10"
                            value={newGrade.teamwork}
                            onChange={(e) => setNewGrade({ ...newGrade, teamwork: e.target.value })}
                            placeholder="1-10"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="overall">Valutazione Generale * (1-10)</Label>
                        <Input
                          id="overall"
                          type="number"
                          min="1"
                          max="10"
                          value={newGrade.overall}
                          onChange={(e) => setNewGrade({ ...newGrade, overall: e.target.value })}
                          placeholder="1-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Note (opzionale)</Label>
                      <Input
                        id="notes"
                        value={newGrade.notes}
                        onChange={(e) => setNewGrade({ ...newGrade, notes: e.target.value })}
                        placeholder="Aggiungi note..."
                      />
                    </div>

                    <Button onClick={handleAddGrade} className="w-full">
                      <IconPlus className="size-4 mr-2" />
                      Aggiungi Voto
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Edit Student Tab */}
              <TabsContent value="edit" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Modifica Dati Studente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Nome</Label>
                        <Input
                          id="firstName"
                          value={editedStudent.firstName || ''}
                          onChange={(e) => setEditedStudent({ ...editedStudent, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Cognome</Label>
                        <Input
                          id="lastName"
                          value={editedStudent.lastName || ''}
                          onChange={(e) => setEditedStudent({ ...editedStudent, lastName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editedStudent.email || ''}
                        onChange={(e) => setEditedStudent({ ...editedStudent, email: e.target.value })}
                      />
                    </div>

                    <Separator />

                    <div className="flex gap-2">
                      <Button onClick={handleSaveStudent} className="flex-1">
                        Salva Modifiche
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setEditedStudent({
                          firstName: student.firstName,
                          lastName: student.lastName,
                          email: student.email,
                        })}
                      >
                        Annulla
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Seleziona uno studente
          </div>
        )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

const columns: ColumnDef<Student>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="border-muted-foreground/40"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="border-muted-foreground/40"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
  {
    accessorKey: "fullName",
    header: "Nome Studente",
    cell: ({ row }) => {
      const student = row.original
      return (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{student.fullName}</span>
            <span className="text-xs text-muted-foreground">{student.email}</span>
          </div>
        </div>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: "averageGrade",
    header: () => <div className="text-center">Media</div>,
    cell: ({ row }) => {
      const grade = row.original.averageGrade
      const colorClass = grade >= 8 ? 'text-emerald-600' : grade >= 6 ? 'text-foreground' : 'text-red-500'
      return (
        <div className={`text-center font-semibold text-lg ${colorClass}`}>
          {grade.toFixed(1)}
        </div>
      )
    },
  },
  {
    accessorKey: "totalGrades",
    header: () => <div className="text-center">Valutazioni</div>,
    cell: ({ row }) => (
      <div className="text-center text-muted-foreground">
        {row.original.totalGrades}
      </div>
    ),
  },
  {
    accessorKey: "performanceLevel",
    header: "Livello",
    cell: ({ row }) => {
      const config = getPerformanceBadge(row.original.performanceLevel)
      return (
        <Badge 
          variant="outline" 
          className={`font-medium text-xs ${config.className}`}
        >
          {config.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: "trends",
    header: "Andamento",
    cell: ({ row }) => {
      const { improving, percentageChange } = row.original.trends
      return (
        <div className="flex items-center gap-1.5">
          {improving ? (
            <>
              <IconTrendingUp className="size-4 text-emerald-500" />
              <span className="text-sm text-emerald-600">+{percentageChange}%</span>
            </>
          ) : (
            <>
              <IconTrendingDown className="size-4 text-red-500" />
              <span className="text-sm text-red-500">{percentageChange}%</span>
            </>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "lastActivityDate",
    header: "Ultima Attività",
    cell: ({ row }) => {
      const date = new Date(row.original.lastActivityDate)
      return (
        <span className="text-sm text-muted-foreground">
          {date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted size-8 hover:bg-muted/50"
              size="icon"
            >
              <IconDotsVertical className="size-4" />
              <span className="sr-only">Apri menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem>Visualizza dettagli</DropdownMenuItem>
            <DropdownMenuItem>Aggiungi voto</DropdownMenuItem>
            <DropdownMenuItem>Storico voti</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Rimuovi</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
    size: 50,
  },
]

export function DataTable({
  data,
  className,
}: {
  data: Student[]
  className?: string
}) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
      globalFilter,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const handleRowClick = (student: Student) => {
    setSelectedStudent(student)
    setIsDetailOpen(true)
  }

  return (
    <>
      <Card className={`border-border/40 shadow-sm ${className || ''}`}>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Studenti</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {data.length} studenti in questa classe
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca studente..."
                  value={globalFilter ?? ""}
                  onChange={(event) => setGlobalFilter(event.target.value)}
                  className="pl-9 h-9 w-48 lg:w-64"
                />
              </div>

              {/* Column Visibility */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5">
                    <IconLayoutColumns className="size-4" />
                    <span className="hidden sm:inline">Colonne</span>
                    <IconChevronDown className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {table
                    .getAllColumns()
                    .filter(
                      (column) =>
                        typeof column.accessorFn !== "undefined" &&
                        column.getCanHide()
                    )
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Add Button */}
              <Button size="sm" className="h-9 gap-1.5">
                <IconPlus className="size-4" />
                <span className="hidden sm:inline">Aggiungi</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="border-t border-border/40">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/30 hover:bg-muted/30 border-b border-border/40">
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead 
                          key={header.id} 
                          colSpan={header.colSpan}
                          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 h-11"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Nessuno studente trovato.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Footer */}
          <div className="flex items-center justify-between px-4 py-4 border-t border-border/40">
            <div className="text-sm text-muted-foreground hidden lg:block">
              {table.getFilteredSelectedRowModel().rows.length} di{" "}
              {table.getFilteredRowModel().rows.length} studenti selezionati
            </div>
            
            <div className="flex w-full items-center justify-between lg:justify-end gap-6 lg:gap-8">
              {/* Rows per page */}
              <div className="flex items-center gap-2">
                <Label htmlFor="rows-per-page" className="text-sm text-muted-foreground whitespace-nowrap">
                  Righe per pagina
                </Label>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value))
                  }}
                >
                  <SelectTrigger size="sm" className="w-16 h-8" id="rows-per-page">
                    <SelectValue
                      placeholder={table.getState().pagination.pageSize}
                    />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Page indicator */}
              <div className="text-sm font-medium whitespace-nowrap">
                Pagina {table.getState().pagination.pageIndex + 1} di{" "}
                {table.getPageCount()}
              </div>
              
              {/* Navigation buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 hidden lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Prima pagina</span>
                  <IconChevronsLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Pagina precedente</span>
                  <IconChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Pagina successiva</span>
                  <IconChevronRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 hidden lg:flex"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Ultima pagina</span>
                  <IconChevronsRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Detail Panel */}
      <StudentDetailPanel
        student={selectedStudent}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </>
  )
}
