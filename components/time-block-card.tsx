"use client"

import type { TimeBlock, BlockTodo } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreVertical, Clock, Calendar, CheckSquare } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatTime } from "@/lib/date-utils"

function withAlpha(color: string, alpha: number): string {
  const hex = color.trim()
  const shortHex = /^#([a-fA-F0-9]{3})$/
  const longHex = /^#([a-fA-F0-9]{6})$/
  if (shortHex.test(hex)) {
    const m = shortHex.exec(hex)!
    const r = parseInt(m[1][0] + m[1][0], 16)
    const g = parseInt(m[1][1] + m[1][1], 16)
    const b = parseInt(m[1][2] + m[1][2], 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  if (longHex.test(hex)) {
    const m = longHex.exec(hex)!
    const r = parseInt(m[1].slice(0, 2), 16)
    const g = parseInt(m[1].slice(2, 4), 16)
    const b = parseInt(m[1].slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return color
}

interface TimeBlockCardProps {
  block: TimeBlock
  hasOverlap?: boolean
  onEdit: (block: TimeBlock) => void
  onDelete: (blockId: string) => void
  onResizeStart: (block: TimeBlock, edge: "top" | "bottom") => void
  onDragStart: (block: TimeBlock) => void
  onToggleTodo?: (blockId: string, todoId: string) => void
  onAddTodo?: (blockId: string, text: string) => void
  onRemoveTodo?: (blockId: string, todoId: string) => void
  onDropTaskToBlock?: (blockId: string) => void
  onSetTodoDoing?: (blockId: string, todoId: string) => void
}

export function TimeBlockCard({ block, hasOverlap, onEdit, onDelete, onResizeStart, onDragStart, onToggleTodo, onAddTodo, onRemoveTodo, onDropTaskToBlock, onSetTodoDoing }: TimeBlockCardProps) {
  const duration = Math.round((block.endTime.getTime() - block.startTime.getTime()) / (1000 * 60))

  const isEvent = block.type === "event"
  const zIndex = isEvent ? "z-0" : "z-10"
  const baseColor = block.color || "#6366f1"
  const bgColor = isEvent ? withAlpha(baseColor, 0.6) : baseColor

  return (
    <Card
      data-block-card
      className={`absolute left-0 right-0 top-0 bottom-0 h-full py-3 pr-3 pl-16 hover:ring-2 hover:ring-primary/50 transition-all group overflow-visible cursor-grab active:cursor-grabbing ${zIndex}`}
      style={{
        backgroundColor: bgColor,
        borderColor: baseColor,
        backgroundImage: hasOverlap
          ? `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)`
          : undefined,
      }}
      onDragOver={(e) => {
        // Allow dropping tasks from kanban to add as ToDo
        e.preventDefault()
        e.stopPropagation()
      }}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onDropTaskToBlock?.(block.id)
      }}
      onMouseDown={(e) => {
        const target = e.target as HTMLElement
        // Edge detection on full card box
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const offsetY = e.clientY - rect.top
        const EDGE_THRESHOLD = 10

        // Skip interactive elements to avoid hijacking clicks
        if (
          target.closest("button") ||
          target.closest('[role="menuitem"]') ||
          target.closest("[data-resize-handle]") ||
          target.closest("input,textarea,select,details,summary,a,[contenteditable='true']")
        ) {
          return
        }

        if (offsetY <= EDGE_THRESHOLD) {
          e.preventDefault()
          e.stopPropagation()
          onResizeStart(block, "top")
          return
        }
        if (rect.height - offsetY <= EDGE_THRESHOLD) {
          e.preventDefault()
          e.stopPropagation()
          onResizeStart(block, "bottom")
          return
        }

        // Otherwise start moving the block
        e.preventDefault()
        onDragStart(block)
      }}
    >
      <div
        data-resize-handle="top"
        className="absolute -top-1 left-0 right-0 h-6 cursor-ns-resize z-40 flex items-center justify-center group/handle"
        onMouseDown={(e) => {
          console.log("[v0] Top resize handle mousedown")
          e.preventDefault()
          e.stopPropagation()
          onResizeStart(block, "top")
        }}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <div className="w-16 h-1 bg-white/40 rounded-full group-hover/handle:bg-white/80 group-hover/handle:h-1.5 transition-all" />
      </div>

      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              {block.type === "event" ? (
                <Calendar className="h-3.5 w-3.5 text-white" />
              ) : (
                <CheckSquare className="h-3.5 w-3.5 text-white" />
              )}
              <h4 className="text-sm font-semibold text-white truncate">{block.title}</h4>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-white" />
              <span className="text-xs text-white">
                {formatTime(block.startTime)} - {formatTime(block.endTime)} ({duration}分)
              </span>
            </div>
            {block.notes && <p className="text-xs text-white mt-1.5 line-clamp-2">{block.notes}</p>}

            {/* Block Todos */}
            {block.todos && block.todos.length > 0 && (
              <div className="mt-2 space-y-1">
                {block.todos.slice(0, 5).map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-xs text-white/95 select-none">
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={(e) => {
                        e.stopPropagation()
                        onToggleTodo?.(block.id, t.id)
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className={t.done ? "line-through opacity-80" : ""}>{t.text}</span>
                    <span className="ml-auto flex items-center gap-2">
                      {!t.done && onSetTodoDoing && (
                        <button
                          className="text-white/80 hover:text-white underline-offset-2 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSetTodoDoing(block.id, t.id)
                          }}
                        >
                          Doing
                        </button>
                      )}
                      {onRemoveTodo && (
                        <button
                          className="text-white/80 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveTodo(block.id, t.id)
                          }}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {/* Inline add input removed per request; use DnD or dialog */}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20 text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(block)}>編集</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(block.id)} className="text-destructive">
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div
        data-resize-handle="bottom"
        className="absolute -bottom-1 left-0 right-0 h-6 cursor-ns-resize z-40 flex items-center justify-center group/handle"
        onMouseDown={(e) => {
          console.log("[v0] Bottom resize handle mousedown")
          e.preventDefault()
          e.stopPropagation()
          onResizeStart(block, "bottom")
        }}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <div className="w-16 h-1 bg-white/40 rounded-full group-hover/handle:bg-white/80 group-hover/handle:h-1.5 transition-all" />
      </div>
    </Card>
  )
}
