"use client"

import * as React from "react"

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Admin = {
  id: string
  fullName: string
  email: string
  createdAt: string
}

export default function AdminsPage() {
  const [admins, setAdmins] = React.useState<Admin[]>([])
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    let active = true

    async function loadAdmins() {
      try {
        const response = await fetch("/api/admins")
        if (!response.ok) {
          throw new Error("Failed to load admins.")
        }
        const data = (await response.json()) as { admins: Admin[] }
        if (active) {
          setAdmins(data.admins)
        }
      } catch (err) {
        if (active) {
          setError("Unable to load admins.")
        }
      }
    }

    loadAdmins()

    return () => {
      active = false
    }
  }, [])

  async function handleDelete(id: string) {
    setError("")
    try {
      const response = await fetch(`/api/admins/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Delete failed.")
      }
      setAdmins((prev) => prev.filter((admin) => admin.id !== id))
    } catch (err) {
      setError("Unable to delete admin.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Admins</h1>
          <p className="text-sm text-muted-foreground">
            Manage admin users and access.
          </p>
        </div>
        <Button size="sm">Invite admin</Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="overflow-hidden rounded-md border bg-background shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                  No admins found.
                </TableCell>
              </TableRow>
            ) : (
              admins.map((admin) => (
                <TableRow key={admin.id} className="hover:bg-muted/40">
                  <TableCell className="font-medium">{admin.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                  <TableCell>
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete admin?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. The admin will be
                            permanently removed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(admin.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
