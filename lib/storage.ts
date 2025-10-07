import type { Task, DaySchedule, AppSettings } from "./types"

const STORAGE_KEYS = {
  TASKS: "blockboard_tasks",
  SETTINGS: "blockboard_settings",
}

const SCHEDULE_COOKIE_PREFIX = "blockboard_schedule_" // e.g. blockboard_schedule_2025-10-06

const DEFAULT_SETTINGS: AppSettings = {
  dayStart: 6,
  dayEnd: 24,
  snapInterval: 15,
  weekStart: 1,
  defaultBlockColor: "#6366f1",
}

export const storage = {
  // Tasks
  getTasks: (): Task[] => {
    if (typeof window === "undefined") return []
    const data = getCookie(STORAGE_KEYS.TASKS)
    if (!data) return []
    return JSON.parse(data).map((t: Task) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
    }))
  },

  saveTasks: (tasks: Task[]) => {
    if (typeof window === "undefined") return
    setCookie(STORAGE_KEYS.TASKS, JSON.stringify(tasks))
  },

  // Schedules
  getSchedule: (date: string): DaySchedule | null => {
    if (typeof window === "undefined") return null
    const data = getCookie(SCHEDULE_COOKIE_PREFIX + date)
    if (!data) return null
    const schedule: DaySchedule | null = data ? JSON.parse(data) : null
    if (!schedule) return null
    return {
      ...schedule,
      blocks: schedule.blocks.map((b) => ({
        ...b,
        startTime: new Date(b.startTime),
        endTime: new Date(b.endTime),
      })),
    }
  },

  saveSchedule: (schedule: DaySchedule) => {
    if (typeof window === "undefined") return
    // Store each day's schedule in its own cookie to avoid size limits
    setCookie(SCHEDULE_COOKIE_PREFIX + schedule.date, JSON.stringify(schedule))
  },

  // Settings
  getSettings: (): AppSettings => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    return data ? JSON.parse(data) : DEFAULT_SETTINGS
  },

  saveSettings: (settings: AppSettings) => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
  },
}

// --- Cookie helpers ---
function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return
  const encoded = encodeURIComponent(value)
  const maxAge = days * 24 * 60 * 60
  document.cookie = `${name}=${encoded}; path=/; max-age=${maxAge}`
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const cookies = document.cookie ? document.cookie.split("; ") : []
  for (const c of cookies) {
    const [k, ...rest] = c.split("=")
    if (k === name) {
      try {
        return decodeURIComponent(rest.join("="))
      } catch {
        return null
      }
    }
  }
  return null
}
