"use client"

import { useState, useEffect } from "react"
import type { AppSettings } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SettingsDialogProps {
  open: boolean
  settings: AppSettings
  onClose: () => void
  onSave: (settings: AppSettings) => void
}

export function SettingsDialog({ open, settings, onClose, onSave }: SettingsDialogProps) {
  const [dayStart, setDayStart] = useState(settings.dayStart)
  const [dayEnd, setDayEnd] = useState(settings.dayEnd)
  const [snapInterval, setSnapInterval] = useState(settings.snapInterval)
  const [weekStart, setWeekStart] = useState(settings.weekStart)

  useEffect(() => {
    setDayStart(settings.dayStart)
    setDayEnd(settings.dayEnd)
    setSnapInterval(settings.snapInterval)
    setWeekStart(settings.weekStart)
  }, [settings, open])

  const handleSave = () => {
    onSave({
      ...settings,
      dayStart,
      dayEnd,
      snapInterval,
      weekStart,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>設定</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>1日の開始時刻</Label>
            <Select value={dayStart.toString()} onValueChange={(v) => setDayStart(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {i.toString().padStart(2, "0")}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>1日の終了時刻</Label>
            <Select value={dayEnd.toString()} onValueChange={(v) => setDayEnd(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => i + 1).map((i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {i.toString().padStart(2, "0")}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>スナップ間隔</Label>
            <Select value={snapInterval.toString()} onValueChange={(v) => setSnapInterval(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5分</SelectItem>
                <SelectItem value="10">10分</SelectItem>
                <SelectItem value="15">15分</SelectItem>
                <SelectItem value="30">30分</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>週の開始曜日</Label>
            <Select value={weekStart.toString()} onValueChange={(v) => setWeekStart(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">日曜日</SelectItem>
                <SelectItem value="1">月曜日</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
