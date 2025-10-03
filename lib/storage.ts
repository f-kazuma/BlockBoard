import type { Task, DaySchedule, AppSettings } from "./types"

const STORAGE_KEYS = {
  TASKS: "blockboard_tasks",
  SCHEDULES: "blockboard_schedules",
  SETTINGS: "blockboard_settings",
}

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
    const data = localStorage.getItem(STORAGE_KEYS.TASKS)
    if (!data) return []
    return JSON.parse(data).map((t: Task) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
    }))
  },

  saveTasks: (tasks: Task[]) => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks))
  },

  // Schedules
  getSchedule: (date: string): DaySchedule | null => {
    if (typeof window === "undefined") return null
    const data = localStorage.getItem(STORAGE_KEYS.SCHEDULES)
    if (!data) return null
    const schedules: DaySchedule[] = JSON.parse(data)
    const schedule = schedules.find((s) => s.date === date)
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
    const data = localStorage.getItem(STORAGE_KEYS.SCHEDULES)
    const schedules: DaySchedule[] = data ? JSON.parse(data) : []
    const index = schedules.findIndex((s) => s.date === schedule.date)
    if (index >= 0) {
      schedules[index] = schedule
    } else {
      schedules.push(schedule)
    }
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules))
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
