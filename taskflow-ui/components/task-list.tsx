"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, Filter, MoreVertical, Circle, CheckCircle2 } from "lucide-react"
import { TaskFormDialog } from "@/components/task-form-dialog"

interface Task {
  id: string
  title: string
  description: string
  priority: "low" | "medium" | "high"
  status: "todo" | "in-progress" | "completed"
  tags: string[]
  dueDate?: string
}

const mockTasks: Task[] = [
  {
    id: "1",
    title: "Design new landing page",
    description: "Create mockups for the new product landing page",
    priority: "high",
    status: "in-progress",
    tags: ["design", "ui"],
    dueDate: "2025-10-20",
  },
  {
    id: "2",
    title: "Implement authentication",
    description: "Add user login and registration functionality",
    priority: "high",
    status: "todo",
    tags: ["backend", "security"],
    dueDate: "2025-10-22",
  },
  {
    id: "3",
    title: "Write documentation",
    description: "Document API endpoints and usage examples",
    priority: "medium",
    status: "todo",
    tags: ["docs"],
    dueDate: "2025-10-25",
  },
  {
    id: "4",
    title: "Fix mobile responsiveness",
    description: "Ensure all pages work well on mobile devices",
    priority: "medium",
    status: "completed",
    tags: ["frontend", "mobile"],
  },
]

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const handleCreateTask = (taskData: Omit<Task, "id">) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
    }
    setTasks([newTask, ...tasks])
    setIsDialogOpen(false)
  }

  const handleUpdateTask = (taskData: Omit<Task, "id">) => {
    if (!editingTask) return
    setTasks(tasks.map((task) => (task.id === editingTask.id ? { ...taskData, id: task.id } : task)))
    setEditingTask(null)
    setIsDialogOpen(false)
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId))
  }

  const handleToggleStatus = (taskId: string) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === taskId) {
          const statusOrder: Task["status"][] = ["todo", "in-progress", "completed"]
          const currentIndex = statusOrder.indexOf(task.status)
          const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]
          return { ...task, status: nextStatus }
        }
        return task
      }),
    )
  }

  const handleEditClick = (task: Task) => {
    setEditingTask(task)
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingTask(null)
  }

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "medium":
        return "bg-chart-3/10 text-chart-3 border-chart-3/20"
      case "low":
        return "bg-muted text-muted-foreground border-border"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-chart-2" />
      case "in-progress":
        return <Circle className="h-5 w-5 text-primary" />
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <div className="h-full p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-balance">Tasks</h1>
            <p className="text-sm text-muted-foreground">Manage your tasks and stay productive</p>
          </div>
          <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Task list */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                {searchQuery ? "No tasks found matching your search." : "No tasks yet. Create your first task!"}
              </p>
            </Card>
          ) : (
            filteredTasks.map((task) => (
              <Card key={task.id} className="p-4 transition-colors hover:bg-muted/50">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleToggleStatus(task.id)}
                    className="mt-0.5 transition-transform hover:scale-110"
                  >
                    {getStatusIcon(task.status)}
                  </button>
                  <button onClick={() => handleEditClick(task)} className="flex-1 space-y-2 text-left">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="font-medium leading-none">{task.title}</h3>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      {task.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          Due {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditClick(task)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const duplicated = { ...task, id: Date.now().toString(), title: `${task.title} (Copy)` }
                          setTasks([duplicated, ...tasks])
                        }}
                      >
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteTask(task.id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <TaskFormDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        initialData={editingTask || undefined}
        mode={editingTask ? "edit" : "create"}
      />
    </div>
  )
}
