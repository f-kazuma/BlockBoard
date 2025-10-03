import type React from "react"
import type { TimeBlock } from "./types"
import { roundToInterval } from "./date-utils"

export function calculateDropPosition(
  e: React.DragEvent,
  containerRef: HTMLElement,
  dayStart: number,
  snapInterval: number,
): Date {
  const rect = containerRef.getBoundingClientRect()
  const y = e.clientY - rect.top
  const pixelsPerMinute = 60 / 60 // 60px per hour = 1px per minute

  const minutesFromStart = Math.round(y / pixelsPerMinute)
  const dropTime = new Date()
  dropTime.setHours(dayStart, minutesFromStart, 0, 0)

  return roundToInterval(dropTime, snapInterval)
}

export function checkBlockOverlap(block1: TimeBlock, block2: TimeBlock): boolean {
  return block1.startTime < block2.endTime && block1.endTime > block2.startTime
}

export function findOverlappingBlocks(newBlock: TimeBlock, existingBlocks: TimeBlock[]): TimeBlock[] {
  return existingBlocks.filter((block) => block.id !== newBlock.id && checkBlockOverlap(newBlock, block))
}
