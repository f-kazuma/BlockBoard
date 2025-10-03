"use client"

import { useState, useEffect } from "react"
import type { TimeBlock, BlockType, BlockTodo } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatTime } from "@/lib/date-utils"
import { Calendar, CheckSquare } from "lucide-react"

interface BlockDialogProps {
  open: boolean
  block?: TimeBlock
  defaultStartTime?: Date
  onClose: () => void
  onSave: (block: Partial<TimeBlock>) => void
  defaultType?: BlockType
}

export function BlockDialog({
  open,
  block,
  defaultStartTime,
  onClose,
  onSave,
  defaultType = "event",
}: BlockDialogProps) {
  const [title, setTitle] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [notes, setNotes] = useState("")
  const [color, setColor] = useState("#6366f1")
  const [type, setType] = useState<BlockType>(defaultType)
  const [todos, setTodos] = useState<BlockTodo[]>([])

  useEffect(() => {
    if (block) {
      setTitle(block.title)
      setStartTime(formatTime(block.startTime))
      setEndTime(formatTime(block.endTime))
      setNotes(block.notes || "")
      setColor(block.color || "#6366f1")
      setType(block.type)
      setTodos(block.todos || [])
    } else {
      setTitle("")
      const now = defaultStartTime || new Date()
      setStartTime(formatTime(now))
      const later = new Date(now.getTime() + 30 * 60 * 1000)
      setEndTime(formatTime(later))
      setNotes("")
      setColor("#6366f1")
      setType(defaultType)
      setTodos([])
    }
  }, [block, open, defaultType, defaultStartTime])

  const handleSave = () => {
    if (!title.trim()) return

    const [startHour, startMinute] = startTime.split(":").map(Number)
    const [endHour, endMinute] = endTime.split(":").map(Number)

    const start = new Date()
    start.setHours(startHour, startMinute, 0, 0)

    const end = new Date()
    end.setHours(endHour, endMinute, 0, 0)

    if (end <= start) {
      alert("終了時刻は開始時刻より後にしてください")
      return
    }

    onSave({
      title: title.trim(),
      startTime: start,
      endTime: end,
      notes: notes.trim() || undefined,
      color,
      type,
      todos,
    })

    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{block ? "ブロックを編集" : "新しいブロック"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!block && (
            <div className="space-y-2">
              <Label>種類</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={type === "event" ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => setType("event")}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  予定
                </Button>
                <Button
                  type="button"
                  variant={type === "task" ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => setType("task")}
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  タスク
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">タイトル</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ブロック名を入力" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">開始時刻</Label>
              <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">終了時刻</Label>
              <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">カラー</Label>
            <div className="flex gap-2">
              {["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e", "#14b8a6"].map((c) => (
                <button
                  key={c}
                  type="button"
                  className="h-8 w-8 rounded-md border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "#fff" : "transparent",
                  }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

        <div className="space-y-2">
          <Label htmlFor="notes">メモ（任意）</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="詳細やメモを入力"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>ToDo（任意）</Label>
          <div className="space-y-2">
            {todos.map((t) => (
              <div key={t.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() =>
                    setTodos((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))
                  }
                />
                <input
                  className="flex-1 rounded-md border bg-background px-2 py-1 text-sm"
                  value={t.text}
                  onChange={(e) =>
                    setTodos((prev) => prev.map((x) => (x.id === t.id ? { ...x, text: e.target.value } : x)))
                  }
                />
                <Button type="button" variant="ghost" onClick={() => setTodos((prev) => prev.filter((x) => x.id !== t.id))}>
                  削除
                </Button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input
                placeholder="新しい項目を追加"
                className="flex-1 rounded-md border bg-background px-2 py-1 text-sm"
                onKeyDown={(e) => {
                  const target = e.target as HTMLInputElement
                  if (e.key === "Enter" && target.value.trim()) {
                    setTodos((prev) => [
                      ...prev,
                      { id: crypto.randomUUID(), text: target.value.trim(), done: false },
                    ])
                    target.value = ""
                  }
                }}
              />
            </div>
          </div>
        </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
