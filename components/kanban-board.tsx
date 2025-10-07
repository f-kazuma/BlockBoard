"use client"

import type React from "react"
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
  const handleBoardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    // Ignore clicks on cards and common interactive elements
    if (
      target.closest('[data-kanban-card]') ||
      target.closest('[data-slot="dropdown-menu-content"]') ||
      target.closest('[data-slot="dropdown-menu-trigger"]') ||
      target.closest('button,[role="menuitem"],input,textarea,select,details,summary,a,[contenteditable="true"]')
    ) {
      return
    }
    onAddTask()
  }

  return (
    <div className="grid grid-cols-3 grid-rows-[1fr_auto] gap-4 h-full content-start" onClick={handleBoardClick}>
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
      {/* Hold area across the board width, anchored to bottom */}
      <div className="col-span-3 row-start-2">
        <KanbanHoldArea
          tasks={tasks}
          onDragStart={onDragStart}
          onDropToHold={() => onDropToStatus?.("hold")}
        />
      </div>
    </div>
  )
}
