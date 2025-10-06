"use client"

import type { TimeBlock, BlockTodo } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreVertical, Clock, Calendar, CheckSquare } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatTime } from "@/lib/date-utils"
import { useEffect, useRef, useState } from "react"
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
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const duration = Math.round((block.endTime.getTime() - block.startTime.getTime()) / (1000 * 60))

  const isEvent = block.type === "event"
  const zIndex = isEvent ? "z-0" : "z-10"
  const baseColor = block.color || "#6366f1"
  const bgColor = isEvent ? withAlpha(baseColor, 0.6) : baseColor

  useEffect(() => {
    if (!menuOpen) return
    const onDocDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (menuRef.current && !menuRef.current.contains(t)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [menuOpen])

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
          target.closest('[data-slot="dropdown-menu-trigger"]') ||
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
        className="absolute -top-1 left-0 right-0 h-6 z-40 flex items-center justify-center group/handle pointer-events-none"
      >
        <div
          className="w-16 h-1 bg-white/40 rounded-full group-hover/handle:bg-white/80 group-hover/handle:h-1.5 transition-all cursor-ns-resize pointer-events-auto"
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
        />
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
                  <label
                    key={t.id}
                    className={`group/todo flex items-center gap-2 text-xs select-none rounded px-1 py-0.5 transition-colors ${
                      t.doing ? "bg-white/20 ring-1 ring-white/30 text-white" : "text-white/95"
                    } ${t.done ? "opacity-80" : ""}`}
                  >
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
                      {!t.done && onSetTodoDoing && !t.doing && (
                        <button
                          className="text-white/80 hover:text-white underline-offset-2 hover:underline opacity-0 group-hover/todo:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSetTodoDoing(block.id, t.id)
                          }}
                        >
                          開始
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

          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 transition-opacity hover:bg-white/20 text-white relative z-50"
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
                className="absolute right-0 top-6 z-[9999] min-w-36 rounded-md border bg-popover text-popover-foreground shadow-md p-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="w-full text-left text-sm rounded-sm px-2 py-1.5 hover:bg-accent hover:text-accent-foreground"
                  onClick={() => {
                    setMenuOpen(false)
                    onEdit(block)
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
          </div>

          {/* Delete confirmation dialog */}
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>削除しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  「{block.title}」をタイムラインから削除します。この操作は元に戻せません。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(block.id)
                  }}
                >
                  削除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div
        data-resize-handle="bottom"
        className="absolute -bottom-1 left-0 right-0 h-6 z-40 flex items-center justify-center group/handle pointer-events-none"
      >
        <div
          className="w-16 h-1 bg-white/40 rounded-full group-hover/handle:bg-white/80 group-hover/handle:h-1.5 transition-all cursor-ns-resize pointer-events-auto"
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
        />
      </div>
    </Card>
  )
}
