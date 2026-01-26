"use client"

import * as React from "react"
import Link from "next/link"
import { MoreHorizontalIcon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

type Column<T> = {
  header: string
  className?: string
  cell: (row: T) => React.ReactNode
}

type ActionConfig<T> = {
  editHref?: (row: T) => string
  onDelete?: (row: T) => void
  deleteDialogTitle?: string
  deleteDialogDescription?: string
}

type DataTableProps<T> = {
  columns: Column<T>[]
  data: T[]
  emptyText?: string
  actions?: ActionConfig<T>
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  emptyText = "No results found.",
  actions,
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-md border bg-background shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead
                key={index}
                className={cn(
                  index === 0 && "pl-4",
                  index === columns.length - 1 && !actions && "pr-4",
                  column.className
                )}
              >
                {column.header}
              </TableHead>
            ))}
            {actions ? (
              <TableHead className="text-right pr-4">Actions</TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="py-6 text-center text-sm text-muted-foreground">
                {emptyText}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/40">
                {columns.map((column, index) => (
                  <TableCell
                    key={index}
                    className={cn(
                      index === 0 && "pl-4",
                      index === columns.length - 1 && !actions && "pr-4",
                      column.className
                    )}
                  >
                    {column.cell(row)}
                  </TableCell>
                ))}
                {actions ? (
                  <TableCell className="pr-4 text-right">
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Open actions">
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {actions.editHref ? (
                            <DropdownMenuItem asChild>
                              <Link href={actions.editHref(row)}>Edit</Link>
                            </DropdownMenuItem>
                          ) : null}
                          {actions.onDelete ? (
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-destructive focus:text-destructive">
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {actions.onDelete ? (
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {actions.deleteDialogTitle ?? "Delete item?"}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {actions.deleteDialogDescription ??
                                "This action cannot be undone."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => actions.onDelete?.(row)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      ) : null}
                    </AlertDialog>
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
