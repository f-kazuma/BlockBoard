export type TaskStatus = "todo" | "doing" | "done" | "hold"

export type BlockType = "event" | "task"

export interface BlockTodo {
  id: string
  text: string
  done: boolean
  doing?: boolean
  taskId?: string // if originated from a Kanban task
}

export interface Task {
  id: string
  title: string
  duration?: number // minutes (任意)
  status: TaskStatus
  color?: string
  notes?: string
  createdAt: Date
  completedAt?: Date
  dueDate?: Date // 期限
  // 日付ごとの看板表示用（YYYY-MM-DD）。未設定の場合は createdAt の日付で扱う
  scheduledDate?: string
}

export interface TimeBlock {
  id: string
  title: string
  startTime: Date
  endTime: Date
  color?: string
  notes?: string
  taskId?: string // linked to a task
  type: BlockType // "event" for standalone events, "task" for kanban-linked tasks
  todos?: BlockTodo[]
}

export interface DaySchedule {
  date: string // YYYY-MM-DD
  blocks: TimeBlock[]
}

export interface AppSettings {
  dayStart: number // hour (0-23)
  dayEnd: number // hour (0-23)
  snapInterval: number // minutes (5, 10, 15, 30)
  weekStart: number // 0 = Sunday, 1 = Monday
  defaultBlockColor: string
}
