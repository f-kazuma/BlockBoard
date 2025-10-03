"use client"

import type { Task, TaskStatus } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Clock, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface KanbanColumnProps {
  title: string
  status: TaskStatus
  tasks: Task[]
  onAddTask?: () => void
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
  onDragStart: (task: Task) => void
  onDropToStatus?: (status: TaskStatus) => void
}

export function KanbanColumn({
  title,
  status,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onDragStart,
  onDropToStatus,
}: KanbanColumnProps) {
  const columnTasks = tasks.filter((t) => t.status === status)

  return (
    <div
      className="flex flex-col gap-3 min-h-[400px]"
      onDragOver={(e) => {
        // allow drops of kanban tasks
        e.preventDefault()
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDropToStatus?.(status)
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-foreground">{title}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{columnTasks.length}</span>
        </div>
        {status === "todo" && onAddTask && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddTask}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {columnTasks.map((task) => (
          <Card
            key={task.id}
            draggable
            onDragStart={() => onDragStart(task)}
            className="p-3 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground truncate">{task.title}</h4>
                <div className="flex items-center gap-1 mt-1.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{task.duration}分</span>
                </div>
                {task.notes && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{task.notes}</p>}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditTask(task)}>編集</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDeleteTask(task.id)} className="text-destructive">
                    削除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {task.color && <div className="h-1 w-full rounded-full mt-2" style={{ backgroundColor: task.color }} />}
          </Card>
        ))}
      </div>
    </div>
  )
}
