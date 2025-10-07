"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import type { Task, TimeBlock } from "@/lib/types"
import { storage } from "@/lib/storage"
import { formatDate, addDays, roundToInterval } from "@/lib/date-utils"
import { findOverlappingBlocks } from "@/lib/drag-utils"
import { KanbanBoard } from "@/components/kanban-board"
import { TimelineView } from "@/components/timeline-view"
import { TaskDialog } from "@/components/task-dialog"
import { BlockDialog } from "@/components/block-dialog"
import { OverlapDialog } from "@/components/overlap-dialog"
import { SettingsDialog } from "@/components/settings-dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar, Settings } from "lucide-react"

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [blocks, setBlocks] = useState<TimeBlock[]>([])
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [draggedBlock, setDraggedBlock] = useState<TimeBlock | null>(null)
  const [resizingBlock, setResizingBlock] = useState<{ block: TimeBlock; edge: "top" | "bottom" } | null>(null)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [overlapDialogOpen, setOverlapDialogOpen] = useState(false)
  const [pendingBlock, setPendingBlock] = useState<TimeBlock | null>(null)
  const [overlappingBlocks, setOverlappingBlocks] = useState<TimeBlock[]>([])
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [editingBlock, setEditingBlock] = useState<TimeBlock | undefined>()
  const [quickEventStartTime, setQuickEventStartTime] = useState<Date | undefined>()
  const [settings, setSettings] = useState(() => storage.getSettings())
  const timelineRef = useRef<HTMLDivElement>(null)
  const [justFinishedResizing, setJustFinishedResizing] = useState(false)
  const [justFinishedDragging, setJustFinishedDragging] = useState(false)

  // Load tasks on mount
  useEffect(() => {
    const loadedTasks = storage.getTasks()
    setTasks(loadedTasks)
  }, [])

  // Load schedule when date changes
  useEffect(() => {
    const dateStr = formatDate(selectedDate)
    const schedule = storage.getSchedule(dateStr)
    setBlocks(schedule?.blocks || [])
  }, [selectedDate])

  // Save tasks whenever they change
  useEffect(() => {
    if (tasks.length > 0 || storage.getTasks().length > 0) {
      storage.saveTasks(tasks)
    }
  }, [tasks])

  // Save schedule whenever blocks change
  useEffect(() => {
    if (blocks.length > 0 || storage.getSchedule(formatDate(selectedDate))) {
      storage.saveSchedule({
        date: formatDate(selectedDate),
        blocks,
      })
    }
  }, [blocks, selectedDate])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const containerEl = document.getElementById("timeline-container") as HTMLDivElement | null
      if (draggedBlock && containerEl) {
        // Handle block dragging
        const rect = containerEl.getBoundingClientRect()
        const y = e.clientY - rect.top
        const pixelsPerMinute = 1
        const minutesFromStart = Math.round(y / pixelsPerMinute)

        const dropTime = new Date()
        dropTime.setHours(settings.dayStart, minutesFromStart, 0, 0)
        // Hold Alt to disable snapping for fine adjustments
        const snappedStartTime = e.altKey ? dropTime : roundToInterval(dropTime, settings.snapInterval)

        const duration = draggedBlock.endTime.getTime() - draggedBlock.startTime.getTime()
        const newEndTime = new Date(snappedStartTime.getTime() + duration)

        setBlocks((prev) =>
          prev.map((b) =>
            b.id === draggedBlock.id
              ? {
                  ...b,
                  startTime: snappedStartTime,
                  endTime: newEndTime,
                }
              : b,
          ),
        )
      }
    }

    const handleMouseUp = () => {
      setDraggedBlock(null)
      // Prevent timeline click-to-add from firing right after dragging a block
      setJustFinishedDragging(true)
      setTimeout(() => setJustFinishedDragging(false), 120)
    }

    if (draggedBlock) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [draggedBlock, settings.dayStart, settings.snapInterval])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const containerEl = document.getElementById("timeline-container") as HTMLDivElement | null
      if (!resizingBlock || !containerEl) return

      const rect = containerEl.getBoundingClientRect()
      const y = e.clientY - rect.top
      const pixelsPerMinute = 1
      const minutesFromStart = Math.round(y / pixelsPerMinute)

      const newTime = new Date()
      newTime.setHours(settings.dayStart, minutesFromStart, 0, 0)
      // Hold Alt to disable snapping for fine adjustments
      const snappedTime = e.altKey ? newTime : roundToInterval(newTime, settings.snapInterval)

      const { block, edge } = resizingBlock

      if (edge === "top") {
        if (snappedTime < block.endTime) {
          const minDuration = (e.altKey ? 1 : settings.snapInterval) * 60 * 1000
          if (block.endTime.getTime() - snappedTime.getTime() >= minDuration) {
            setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, startTime: snappedTime } : b)))
          }
        }
      } else {
        if (snappedTime > block.startTime) {
          const minDuration = (e.altKey ? 1 : settings.snapInterval) * 60 * 1000
          if (snappedTime.getTime() - block.startTime.getTime() >= minDuration) {
            setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, endTime: snappedTime } : b)))
          }
        }
      }
    }

    const handleMouseUp = () => {
      if (resizingBlock) {
        setJustFinishedResizing(true)
        setTimeout(() => setJustFinishedResizing(false), 100)
      }
      setResizingBlock(null)
    }

    if (resizingBlock) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [resizingBlock, settings.dayStart, settings.snapInterval])

  useEffect(() => {
    if (resizingBlock) {
      document.body.style.cursor = "ns-resize"
      return () => {
        document.body.style.cursor = ""
      }
    }
  }, [resizingBlock])

  const handleAddTask = () => {
    setEditingTask(undefined)
    setTaskDialogOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setTaskDialogOpen(true)
  }

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? { ...t, ...taskData } : t)))
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: taskData.title!,
        duration: taskData.duration,
        status: "todo",
        color: taskData.color,
        notes: taskData.notes,
        createdAt: new Date(),
        dueDate: taskData.dueDate,
      }
      setTasks((prev) => [...prev, newTask])
    }
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    setBlocks((prev) => prev.filter((b) => b.taskId !== taskId))
  }

  const handleTaskDragStart = (task: Task) => {
    setDraggedTask(task)
    setDraggedBlock(null)
  }

  const handleEditBlock = (block: TimeBlock) => {
    setEditingBlock(block)
    setBlockDialogOpen(true)
  }

  const handleSaveBlock = (blockData: Partial<TimeBlock>) => {
    if (editingBlock) {
      setBlocks((prev) => prev.map((b) => (b.id === editingBlock.id ? { ...b, ...blockData } : b)))
    } else {
      const newBlock: TimeBlock = {
        id: crypto.randomUUID(),
        title: blockData.title!,
        startTime: blockData.startTime!,
        endTime: blockData.endTime!,
        color: blockData.color,
        notes: blockData.notes,
        type: blockData.type || "event",
        todos: blockData.todos || [],
      }
      setBlocks((prev) => [...prev, newBlock])
    }
  }

  const handleDeleteBlock = (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId)
    setBlocks((prev) => prev.filter((b) => b.id !== blockId))

    if (block?.taskId && block.type === "task") {
      setTasks((prev) => prev.map((t) => (t.id === block.taskId ? { ...t, status: "todo" as const } : t)))
    }
  }

  // Block Todos handlers
  const handleToggleBlockTodo = (blockId: string, todoId: string) => {
    // Get current todo state to determine new state
    const currentBlocks = blocks
    const block = currentBlocks.find((b) => b.id === blockId)
    const todo = block?.todos?.find((t) => t.id === todoId)
    
    if (!todo) return

    const newDone = !todo.done
    console.log('[DEBUG] Toggle todo:', { todo, newDone, hasTaskId: !!todo?.taskId })

    // If linked to a kanban task, update the task status first
    if (todo.taskId) {
      if (newDone) {
        // Set task to done - this will trigger the same sync logic as Kanban drag
        console.log('[DEBUG] Setting task to done:', todo.taskId)
        setTasks((prevTasks) =>
          prevTasks.map((tsk) =>
            tsk.id === todo.taskId ? { ...tsk, status: "done" as const, completedAt: new Date() } : tsk,
          ),
        )
        // Sync ALL timeline todos linked to this task (same as Kanban logic)
        setBlocks((prev) =>
          prev.map((b) =>
            b.todos && b.todos.length > 0
              ? {
                  ...b,
                  todos: b.todos.map((td) =>
                    td.taskId === todo.taskId
                      ? {
                          ...td,
                          done: true,
                          doing: false,
                        }
                      : td,
                  ),
                }
              : b,
          ),
        )
      } else {
        // Uncheck: revert to doing if marked, otherwise todo
        const newStatus = todo.doing ? "doing" : "todo"
        console.log('[DEBUG] Setting task back to:', newStatus)
        setTasks((prevTasks) =>
          prevTasks.map((tsk) =>
            tsk.id === todo.taskId
              ? { ...tsk, status: newStatus as const, completedAt: undefined }
              : tsk,
          ),
        )
        // Sync ALL timeline todos linked to this task (same as Kanban logic)
        setBlocks((prev) =>
          prev.map((b) =>
            b.todos && b.todos.length > 0
              ? {
                  ...b,
                  todos: b.todos.map((td) =>
                    td.taskId === todo.taskId
                      ? {
                          ...td,
                          done: false,
                          doing: newStatus === "doing" ? true : false,
                        }
                      : td,
                  ),
                }
              : b,
          ),
        )
      }
    } else {
      // If not linked to a kanban task, just toggle the todo locally
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === blockId
            ? {
                ...b,
                todos: (b.todos || []).map((t) =>
                  t.id === todoId ? { ...t, done: newDone, doing: newDone ? false : t.doing } : t,
                ),
              }
            : b,
        ),
      )
    }
  }

  const handleAddBlockTodo = (blockId: string, text: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId ? { ...b, todos: [...(b.todos || []), { id: crypto.randomUUID(), text, done: false }] } : b,
      ),
    )
  }

  const handleRemoveBlockTodo = (blockId: string, todoId: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, todos: (b.todos || []).filter((t) => t.id !== todoId) } : b)))
  }

  const handleSetBlockTodoDoing = (blockId: string, todoId: string) => {
    const block = blocks.find((b) => b.id === blockId)
    const todo = block?.todos?.find((t) => t.id === todoId)
    const taskId = todo?.taskId
    if (!taskId) return
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "doing" as const } : t)))
    // Reflect doing state on the linked todo
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? { ...b, todos: (b.todos || []).map((td) => (td.id === todoId ? { ...td, doing: true } : td)) }
          : b,
      ),
    )
  }

  const handleBlockDragStart = (block: TimeBlock) => {
    if (resizingBlock) return
    setDraggedBlock(block)
    setDraggedTask(null)
  }

  const handleResizeStart = (block: TimeBlock, edge: "top" | "bottom") => {
    setDraggedBlock(null)
    setDraggedTask(null)
    setResizingBlock({ block, edge })
  }

  const handleTimelineDrop = (e: React.DragEvent) => {
    e.preventDefault()

    const timelineElement = e.currentTarget as HTMLElement
    if (!timelineElement) return

    const rect = timelineElement.getBoundingClientRect()
    const y = e.clientY - rect.top
    const pixelsPerMinute = 1
    const minutesFromStart = Math.round(y / pixelsPerMinute)

    const dropTime = new Date()
    dropTime.setHours(settings.dayStart, minutesFromStart, 0, 0)
    const snappedStartTime = roundToInterval(dropTime, settings.snapInterval)

    if (draggedTask) {
      const endTime = new Date(snappedStartTime.getTime() + draggedTask.duration * 60 * 1000)

      const newBlock: TimeBlock = {
        id: crypto.randomUUID(),
        title: draggedTask.title,
        startTime: snappedStartTime,
        endTime,
        color: draggedTask.color,
        notes: draggedTask.notes,
        taskId: draggedTask.id,
        type: "task",
      }

      const overlaps = findOverlappingBlocks(newBlock, blocks)
      if (overlaps.length > 0) {
        setPendingBlock(newBlock)
        setOverlappingBlocks(overlaps)
        setOverlapDialogOpen(true)
      } else {
        setBlocks((prev) => [...prev, newBlock])
        // Do not auto-change task status when added to timeline
      }
      setDraggedTask(null)
    }
  }

  const handleTimelineDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handlePreviousDay = () => {
    setSelectedDate((prev) => addDays(prev, -1))
  }

  const handleNextDay = () => {
    setSelectedDate((prev) => addDays(prev, 1))
  }

  const handleToday = () => {
    setSelectedDate(new Date())
  }

  const handleSaveSettings = (newSettings: typeof settings) => {
    setSettings(newSettings)
    storage.saveSettings(newSettings)
  }

  const handleAddEvent = () => {
    setEditingBlock(undefined)
    setQuickEventStartTime(undefined)
    setBlockDialogOpen(true)
  }

  const handleTimelineClick = (startTime: Date) => {
    if (justFinishedResizing || justFinishedDragging || draggedBlock || resizingBlock) return
    setEditingBlock(undefined)
    setQuickEventStartTime(startTime)
    setBlockDialogOpen(true)
  }

  const handleOverlapResolve = (action: "push" | "allow" | "cancel") => {
    if (!pendingBlock) return

    if (action === "push") {
      const newBlocks = [...blocks]
      const sortedOverlaps = [...overlappingBlocks].sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

      let currentEndTime = pendingBlock.endTime

      sortedOverlaps.forEach((overlap) => {
        const duration = overlap.endTime.getTime() - overlap.startTime.getTime()
        const index = newBlocks.findIndex((b) => b.id === overlap.id)
        if (index >= 0) {
          newBlocks[index] = {
            ...newBlocks[index],
            startTime: new Date(currentEndTime),
            endTime: new Date(currentEndTime.getTime() + duration),
          }
          currentEndTime = newBlocks[index].endTime
        }
      })

      setBlocks([...newBlocks, pendingBlock])
      // Do not auto-change task status when resolving overlaps
    } else if (action === "allow") {
      setBlocks((prev) => [...prev, pendingBlock])
      // Do not auto-change task status when resolving overlaps
    }

    setPendingBlock(null)
    setOverlappingBlocks([])
    setOverlapDialogOpen(false)
  }

  const isToday = formatDate(selectedDate) === formatDate(new Date())

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">BlockBoard</h1>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePreviousDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant={isToday ? "default" : "outline"} onClick={handleToday} className="min-w-[120px]">
                <Calendar className="h-4 w-4 mr-2" />
                {isToday
                  ? "今日"
                  : selectedDate.toLocaleDateString("ja-JP", {
                      month: "short",
                      day: "numeric",
                    })}
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextDay}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={() => setSettingsDialogOpen(true)}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Kanban Board */}
        <div className="w-[400px] border-r border-border bg-card p-6 overflow-y-auto">
          <KanbanBoard
            tasks={tasks}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onDragStart={handleTaskDragStart}
            onDropToStatus={(status) => {
              if (!draggedTask) return
              setTasks((prev) =>
                prev.map((t) =>
                  t.id === draggedTask.id
                    ? {
                        ...t,
                        status,
                        completedAt: status === "done" ? new Date() : undefined,
                      }
                    : t,
                ),
              )
              // Sync timeline todos linked to this task
              setBlocks((prev) =>
                prev.map((b) =>
                  b.todos && b.todos.length > 0
                    ? {
                        ...b,
                        todos: b.todos.map((td) =>
                          td.taskId === draggedTask.id
                            ? {
                                ...td,
                                done: status === "done" ? true : false,
                                doing:
                                  status === "doing"
                                    ? true
                                    : status === "todo" || status === "done"
                                    ? false
                                    : td.doing,
                              }
                            : td,
                        ),
                      }
                    : b,
                ),
              )
              setDraggedTask(null)
            }}
          />
        </div>

        {/* Timeline */}
        <div ref={timelineRef} className="flex-1 bg-background py-6 pr-6 pl-0 overflow-y-auto">
          <TimelineView
            blocks={blocks}
            settings={settings}
            isToday={isToday}
            onEditBlock={handleEditBlock}
            onDeleteBlock={handleDeleteBlock}
            onResizeStart={handleResizeStart}
            onDragStart={handleBlockDragStart}
            onDrop={handleTimelineDrop}
            onDragOver={handleTimelineDragOver}
            onAddEvent={handleAddEvent}
            onClickTimeline={handleTimelineClick}
            onToggleTodo={handleToggleBlockTodo}
            onAddTodo={handleAddBlockTodo}
            onRemoveTodo={handleRemoveBlockTodo}
            onSetTodoDoing={handleSetBlockTodoDoing}
            onDropTaskToBlock={(blockId) => {
              if (!draggedTask) return
              // Add the dragged task as a ToDo inside the dropped block
              const text = draggedTask.title
              setBlocks((prev) =>
                prev.map((b) =>
                  b.id === blockId
                    ? {
                        ...b,
                        todos: [
                          ...(b.todos || []),
                          { id: crypto.randomUUID(), text, done: false, taskId: draggedTask.id },
                        ],
                      }
                    : b,
                ),
              )
              // Optionally keep or update task status; we leave as-is for now
              setDraggedTask(null)
            }}
          />
        </div>
      </div>

      {/* Dialogs */}
      <TaskDialog
        open={taskDialogOpen}
        task={editingTask}
        onClose={() => setTaskDialogOpen(false)}
        onSave={handleSaveTask}
      />

      <BlockDialog
        open={blockDialogOpen}
        block={editingBlock}
        defaultStartTime={quickEventStartTime}
        onClose={() => {
          setBlockDialogOpen(false)
          setQuickEventStartTime(undefined)
        }}
        onSave={handleSaveBlock}
      />

      <SettingsDialog
        open={settingsDialogOpen}
        settings={settings}
        onClose={() => setSettingsDialogOpen(false)}
        onSave={handleSaveSettings}
      />

      {pendingBlock && (
        <OverlapDialog
          open={overlapDialogOpen}
          newBlock={pendingBlock}
          overlappingBlocks={overlappingBlocks}
          onResolve={handleOverlapResolve}
        />
      )}
    </div>
  )
}
