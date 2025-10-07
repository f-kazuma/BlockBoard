"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import type { TimeBlock, AppSettings } from "@/lib/types"
import { TimelineGrid } from "./timeline-grid"
import { TimeBlockCard } from "./time-block-card"
import { checkBlockOverlap } from "@/lib/drag-utils"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TimelineViewProps {
  blocks: TimeBlock[]
  settings: AppSettings
  onEditBlock: (block: TimeBlock) => void
  onDeleteBlock: (blockId: string) => void
  onResizeStart: (block: TimeBlock, edge: "top" | "bottom") => void
  onDragStart: (block: TimeBlock) => void
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onAddEvent: () => void
  onClickTimeline?: (startTime: Date) => void
  onToggleTodo?: (blockId: string, todoId: string) => void
  onAddTodo?: (blockId: string, text: string) => void
  onRemoveTodo?: (blockId: string, todoId: string) => void
  onDropTaskToBlock?: (blockId: string) => void
  onSetTodoDoing?: (blockId: string, todoId: string) => void
  isToday?: boolean
}

export function TimelineView({
  blocks,
  settings,
  isToday,
  onEditBlock,
  onDeleteBlock,
  onResizeStart,
  onDragStart,
  onDrop,
  onDragOver,
  onAddEvent,
  onClickTimeline,
  onToggleTodo,
  onAddTodo,
  onRemoveTodo,
  onDropTaskToBlock,
  onSetTodoDoing,
}: TimelineViewProps) {
  const { dayStart, dayEnd, snapInterval } = settings
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoverY, setHoverY] = useState<number | null>(null)
  const [nowY, setNowY] = useState<number | null>(null)

  // Calculate pixel height per minute (60px per hour = 1px per minute)
  const pixelsPerMinute = 60 / 60

  const blockPositions = useMemo(() => {
    return blocks.map((block) => {
      const startMinutes = block.startTime.getHours() * 60 + block.startTime.getMinutes()
      const endMinutes = block.endTime.getHours() * 60 + block.endTime.getMinutes()
      const dayStartMinutes = dayStart * 60

      const top = (startMinutes - dayStartMinutes) * pixelsPerMinute
      const height = (endMinutes - startMinutes) * pixelsPerMinute

      // Check if this block overlaps with any other block
      const hasOverlap = blocks.some((other) => other.id !== block.id && checkBlockOverlap(block, other))

      return { block, top, height, hasOverlap }
    })
  }, [blocks, dayStart, pixelsPerMinute])

  const handleDrop = (e: React.DragEvent) => {
    if (containerRef.current) {
      onDrop(e)
    }
  }

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!containerRef.current || !onClickTimeline) return

    const target = e.target as HTMLElement
    if (target.closest("[data-block-card]") || target.closest("[data-resize-handle]")) return

    const rect = containerRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    const minutesFromStart = Math.round(y / pixelsPerMinute)
    const totalMinutes = dayStart * 60 + minutesFromStart

    // Snap to interval
    const snappedMinutes = Math.round(totalMinutes / snapInterval) * snapInterval

    const startTime = new Date()
    startTime.setHours(Math.floor(snappedMinutes / 60), snappedMinutes % 60, 0, 0)

    onClickTimeline(startTime)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return

    const target = e.target as HTMLElement
    // When hovering over blocks or interactive elements, hide hover line
    if (
      target.closest('[data-block-card]') ||
      target.closest('[data-resize-handle]') ||
      target.closest('button,[role="menuitem"],input,textarea,select,details,summary,a,[contenteditable="true"]')
    ) {
      if (hoverY !== null) setHoverY(null)
      return
    }

    const rect = containerRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    const minutesFromStart = Math.round(y / pixelsPerMinute)
    const snappedMinutes = Math.round((dayStart * 60 + minutesFromStart) / snapInterval) * snapInterval
    const snappedY = (snappedMinutes - dayStart * 60) * pixelsPerMinute
    setHoverY(snappedY)
  }

  const handleMouseLeave = () => {
    setHoverY(null)
  }

  // Current time indicator
  React.useEffect(() => {
    const updateNow = () => {
      if (!isToday) {
        setNowY(null)
        return
      }
      const now = new Date()
      const minutes = now.getHours() * 60 + now.getMinutes()
      const start = dayStart * 60
      const end = dayEnd * 60
      if (minutes < start || minutes > end) {
        setNowY(null)
      } else {
        const y = (minutes - start) * pixelsPerMinute
        setNowY(y)
      }
    }
    updateNow()
    const id = setInterval(updateNow, 30000)
    return () => clearInterval(id)
  }, [isToday, dayStart, dayEnd, pixelsPerMinute])

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6 pl-16">
        <h2 className="text-lg font-semibold text-foreground">タイムライン</h2>
        <Button onClick={onAddEvent} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          予定を追加
        </Button>
      </div>

      <div
        id="timeline-container"
        ref={containerRef}
        className="relative pl-16 cursor-crosshair"
        onDrop={handleDrop}
        onDragOver={onDragOver}
        onClick={handleTimelineClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <TimelineGrid dayStart={dayStart} dayEnd={dayEnd} snapInterval={snapInterval} />

        {hoverY !== null && (
          <div
            className="absolute left-16 right-0 h-0.5 bg-primary/50 pointer-events-none z-20"
            style={{ top: `${hoverY}px` }}
          />
        )}

        {nowY !== null && (
          <div
            className="absolute left-16 right-0 h-0.5 bg-red-500 dark:bg-red-400 pointer-events-none z-30"
            style={{ top: `${nowY}px` }}
          />
        )}

        {/* Render blocks */}
        <div className="absolute top-0 left-16 right-0">
          {blockPositions.map(({ block, top, height, hasOverlap }) => (
            <div
              key={block.id}
              className="absolute -left-16 right-0"
              style={{ top: `${top}px`, height: `${height}px` }}
            >
              <TimeBlockCard
                block={block}
                hasOverlap={hasOverlap}
                onEdit={onEditBlock}
                onDelete={onDeleteBlock}
                onResizeStart={onResizeStart}
                onDragStart={onDragStart}
                onToggleTodo={onToggleTodo}
                onAddTodo={onAddTodo}
                onRemoveTodo={onRemoveTodo}
                onDropTaskToBlock={onDropTaskToBlock}
                onSetTodoDoing={onSetTodoDoing}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
