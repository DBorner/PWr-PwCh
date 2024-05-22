"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, Cookie, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { GameHistory } from "../types/game-history"
import axios from "axios"
import { useCookies } from "react-cookie"
import { redirect } from "next/dist/server/api-utils"
import { navigate } from "../actions"
import { config } from "process"

interface GameTableProps {
  games: GameHistory[];
  refresh: () => void;
}

export function GameHistoryTable({ games: data, refresh }: GameTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [cookies, setCookie, removeCookie] = useCookies(['game', 'playerPrivateKey', "playerPublicKey", 'accessToken',]);
  const [gameName, setGameName] = React.useState<string>("")
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const columns: ColumnDef<GameHistory>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "player1Name",
    header: "Player 1",
    cell: ({ row }) => {
        const winner = row.original.winner
        const player1Id = row.original.player1
        if (winner === player1Id) {
            return <div className="capitalize">{row.getValue("player1Name") + ' 👑'}</div>
        }
        return <div className="capitalize">{row.getValue("player1Name")}</div>
    }
  },
  {
    accessorKey: "player2Name",
    header: "Player 2",
    cell: ({ row }) => {
        const winner = row.original.winner
        const player2Id = row.original.player2
        if (winner === player2Id) {
            return <div className="capitalize">{row.getValue("player2Name") + ' 👑'}</div>
        }
        return <div className="capitalize">{row.getValue("player2Name")}</div>
    }
  },
    {
        accessorKey: "createdAt",
        header: "When",
        cell: ({ row }) => {
            const convertedDate = new Date(row.getValue("createdAt"))
            return <div>{convertedDate.toLocaleTimeString() + " " + convertedDate.toLocaleDateString()}</div>
        }
    },
    {
        accessorKey: "winner",
        header: "Winner",
        cell: ({ row }) => {
            const winner = row.getValue("winner")
            const player1Id = row.original.player1
            const player2Id = row.original.player2
            if (winner === player1Id) {
                return <div className="capitalize">{row.getValue("player1Name") + ' won!'}</div>
            }
            if (winner === player2Id) {
                return <div className="capitalize">{row.getValue("player2Name") + ' won!'}</div>
            }
            return <div>Draw</div>
        }
      },
]

  const table = useReactTable({
    data: data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const config = {
    headers: {
      Authorization: 'Bearer ' + cookies.accessToken,
    }
  }


  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="hidden lg:block ml-auto">
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
          >
            Refresh
          </Button>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
