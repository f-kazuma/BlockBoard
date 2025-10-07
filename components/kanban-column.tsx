"use client"

import { useEffect, useRef, useState } from "react"
import type { Task, TaskStatus } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, MoreVertical, Calendar } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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

  const formatDueDate = (dueDate: Date) => {
    const now = new Date()
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}日経過`, isOverdue: true }
    } else if (diffDays === 0) {
      return { text: "今日", isToday: true }
    } else if (diffDays === 1) {
      return { text: "明日", isTomorrow: true }
    } else {
      return { text: `${diffDays}日後`, isNormal: true }
    }
  }

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
      </div>

      <div className="flex flex-col gap-2">
        {columnTasks.map((task) => (
          <Card
            key={task.id}
            draggable
            data-kanban-card
            onDragStart={(e) => {
              // Prevent drag when interacting with menu or elements marked as no-drag
              const target = e.target as HTMLElement
              if (target.closest('[data-no-drag]')) {
                e.preventDefault()
                return
              }
              onDragStart(task)
            }}
            className="p-3 cursor-default hover:border-primary/50 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground truncate">{task.title}</h4>
                {task.dueDate && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span 
                      className={`text-xs ${
                        formatDueDate(task.dueDate).isOverdue 
                          ? "text-red-500 font-medium" 
                          : formatDueDate(task.dueDate).isToday
                          ? "text-orange-500 font-medium"
                          : formatDueDate(task.dueDate).isTomorrow
                          ? "text-yellow-600 font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatDueDate(task.dueDate).text}
                    </span>
                  </div>
                )}
                {task.duration && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{task.duration}分</span>
                  </div>
                )}
                {task.notes && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{task.notes}</p>}
              </div>

              {/* Menu aligned with timeline block behavior */}
              <KanbanCardMenu
                onEdit={() => onEditTask(task)}
                onDelete={() => onDeleteTask(task.id)}
              />
            </div>

            {task.color && <div className="h-1 w-full rounded-full mt-2" style={{ backgroundColor: task.color }} />}
          </Card>
        ))}
      </div>
    </div>
  )
}

function KanbanCardMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDocDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (menuRef.current && !menuRef.current.contains(t)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", onDocDown)
    return () => document.removeEventListener("mousedown", onDocDown)
  }, [menuOpen])

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        data-no-drag
        className="h-6 w-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          setMenuOpen((v) => !v)
        }}
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </Button>
      {menuOpen && (
        <div
          className="absolute right-0 top-6 z-[9999] min-w-28 rounded-md border bg-popover text-popover-foreground shadow-md p-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left text-sm rounded-sm px-2 py-1.5 hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              setMenuOpen(false)
              onEdit()
            }}
          >
            編集
          </button>
          <button
            className="w-full text-left text-sm rounded-sm px-2 py-1.5 text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
            onClick={() => {
              setMenuOpen(false)
              setConfirmOpen(true)
            }}
          >
            削除
          </button>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              このタスクを看板から削除します。この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
