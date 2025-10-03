"use client"

import { useState, useEffect } from "react"
import type { Task } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface TaskDialogProps {
  open: boolean
  task?: Task
  onClose: () => void
  onSave: (task: Partial<Task>) => void
}

export function TaskDialog({ open, task, onClose, onSave }: TaskDialogProps) {
  const [title, setTitle] = useState("")
  const [duration, setDuration] = useState(30)
  const [notes, setNotes] = useState("")
  const [color, setColor] = useState("#6366f1")

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDuration(task.duration)
      setNotes(task.notes || "")
      setColor(task.color || "#6366f1")
    } else {
      setTitle("")
      setDuration(30)
      setNotes("")
      setColor("#6366f1")
    }
  }, [task, open])

  const handleSave = () => {
    if (!title.trim()) return

    onSave({
      title: title.trim(),
      duration,
      notes: notes.trim() || undefined,
      color,
    })

    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "タスクを編集" : "新しいタスク"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">タイトル</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タスク名を入力" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">所要時間（分）</Label>
            <Input
              id="duration"
              type="number"
              min={5}
              max={240}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
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
