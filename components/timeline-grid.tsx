"use client"

import { useMemo } from "react"
import { getTimeSlots } from "@/lib/date-utils"

interface TimelineGridProps {
  dayStart: number
  dayEnd: number
  snapInterval: number
}

export function TimelineGrid({ dayStart, dayEnd, snapInterval }: TimelineGridProps) {
  const timeSlots = useMemo(() => getTimeSlots(dayStart, dayEnd, snapInterval), [dayStart, dayEnd, snapInterval])

  // Calculate height per slot (60px per hour)
  const slotHeight = (60 / 60) * snapInterval // 60px per hour * (interval/60)

  return (
    <div className="relative">
      {timeSlots.map((slot, index) => {
        const hour = slot.getHours()
        const minute = slot.getMinutes()
        const isHourMark = minute === 0

        return (
          <div key={index} className="relative border-t border-border/40" style={{ height: `${slotHeight}px` }}>
            {isHourMark && (
              <div className="absolute -left-16 -top-2.5 w-14 text-right pointer-events-none">
                <span className="text-xs text-muted-foreground font-mono">{hour.toString().padStart(2, "0")}:00</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
