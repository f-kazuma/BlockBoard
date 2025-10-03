"use client"

import type { Task } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Clock } from "lucide-react"

interface KanbanHoldAreaProps {
  tasks: Task[]
  onDragStart: (task: Task) => void
  onDropToHold?: () => void
}

export function KanbanHoldArea({ tasks, onDragStart, onDropToHold }: KanbanHoldAreaProps) {
  const holdTasks = tasks.filter((t) => t.status === "hold")

  return (
    <div
      className="flex flex-col gap-2 border rounded-md p-3 bg-card/50 min-h-[140px]"
      onDragOver={(e) => {
        e.preventDefault()
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDropToHold?.()
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-foreground">保留</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {holdTasks.length}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {holdTasks.map((task) => (
          <Card
            key={task.id}
            draggable
            onDragStart={() => onDragStart(task)}
            className="p-3 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground truncate">{task.title}</h4>
                <div className="flex items-center gap-1 mt-1.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{task.duration}分</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

