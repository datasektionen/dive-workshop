"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"

type OrderablePickerProps<TItem extends { id: string }> = {
  items: TItem[]
  selectedIds: string[]
  onChange: React.Dispatch<React.SetStateAction<string[]>>
  selectedLabel: string
  availableLabel: string
  emptySelectedText: string
  emptyAvailableText: string
  getTitle: (item: TItem) => React.ReactNode
  getMeta?: (item: TItem) => React.ReactNode
}

export function OrderablePicker<TItem extends { id: string }>({
  items,
  selectedIds,
  onChange,
  selectedLabel,
  availableLabel,
  emptySelectedText,
  emptyAvailableText,
  getTitle,
  getMeta,
}: OrderablePickerProps<TItem>) {
  const move = React.useCallback(
    (itemId: string, direction: "up" | "down") => {
      onChange((prev) => {
        const index = prev.indexOf(itemId)
        if (index === -1) return prev
        const nextIndex = direction === "up" ? index - 1 : index + 1
        if (nextIndex < 0 || nextIndex >= prev.length) return prev
        const next = [...prev]
        ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
        return next
      })
    },
    [onChange]
  )

  const add = React.useCallback(
    (itemId: string) => {
      onChange((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]))
    },
    [onChange]
  )

  const remove = React.useCallback(
    (itemId: string) => {
      onChange((prev) => prev.filter((id) => id !== itemId))
    },
    [onChange]
  )

  const selectedItems = selectedIds
    .map((id) => items.find((item) => item.id === id))
    .filter(Boolean) as TItem[]
  const availableItems = items.filter(
    (item) => !selectedIds.includes(item.id)
  )

  return (
    <div className="space-y-4 rounded-md border p-3">
      <div>
        <p className="text-sm font-medium">{selectedLabel}</p>
        {selectedIds.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptySelectedText}</p>
        ) : (
          <div className="mt-2 space-y-2">
            {selectedItems.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{getTitle(item)}</p>
                  {getMeta ? (
                    <p className="text-xs text-muted-foreground">
                      {getMeta(item)}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => move(item.id, "up")}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => move(item.id, "down")}
                    disabled={index === selectedItems.length - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => remove(item.id)}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium">{availableLabel}</p>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyAvailableText}</p>
        ) : (
          <div className="mt-2 space-y-2">
            {availableItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{getTitle(item)}</p>
                  {getMeta ? (
                    <p className="text-xs text-muted-foreground">
                      {getMeta(item)}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => add(item.id)}
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
