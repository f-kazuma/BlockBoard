"use client"

import type { TimeBlock } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { formatTime } from "@/lib/date-utils"

interface OverlapDialogProps {
  open: boolean
  newBlock: TimeBlock
  overlappingBlocks: TimeBlock[]
  onResolve: (action: "push" | "allow" | "cancel") => void
}

export function OverlapDialog({ open, newBlock, overlappingBlocks, onResolve }: OverlapDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => onResolve("cancel")}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            時間の重複が検出されました
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              新しいブロック「{newBlock.title}」が以下のブロックと重複しています：
            </p>

            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {overlappingBlocks.map((block) => (
                <div key={block.id} className="p-3 rounded-lg border border-border bg-card">
                  <div className="font-medium text-sm">{block.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatTime(block.startTime)} - {formatTime(block.endTime)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">解決方法を選択してください：</p>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => onResolve("push")}
              >
                <span className="font-medium">後ろに押し出す</span>
                <span className="text-xs text-muted-foreground ml-2">重複するブロックを後ろにずらす</span>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => onResolve("allow")}
              >
                <span className="font-medium">重なりを許可</span>
                <span className="text-xs text-muted-foreground ml-2">そのまま配置する</span>
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onResolve("cancel")}>
            キャンセル
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
