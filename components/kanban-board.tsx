"use client"

import type { Task } from "@/lib/types"
import { KanbanColumn } from "./kanban-column"
import { KanbanHoldArea } from "./kanban-hold"

interface KanbanBoardProps {
  tasks: Task[]
  onAddTask: () => void
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
  onDragStart: (task: Task) => void
  onDropToStatus?: (status: Task["status"]) => void
}

export function KanbanBoard({ tasks, onAddTask, onEditTask, onDeleteTask, onDragStart, onDropToStatus }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-3 gap-4 h-full content-start">
      <KanbanColumn
        title="ToDo"
        status="todo"
        tasks={tasks}
        onAddTask={onAddTask}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
        onDragStart={onDragStart}
        onDropToStatus={onDropToStatus}
      />
      <KanbanColumn
        title="Doing"
        status="doing"
        tasks={tasks}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
        onDragStart={onDragStart}
        onDropToStatus={onDropToStatus}
      />
      <KanbanColumn
        title="Done"
        status="done"
        tasks={tasks}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
        onDragStart={onDragStart}
        onDropToStatus={onDropToStatus}
      />
      {/* Hold area under the ToDo column */}
      <div className="col-span-1">
        <KanbanHoldArea
          tasks={tasks}
          onDragStart={onDragStart}
          onDropToHold={() => onDropToStatus?.("hold")}
        />
      </div>
    </div>
  )
}
