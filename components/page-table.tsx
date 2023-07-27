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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTablePagination } from "@/components/data-table-pagination"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  needPagination?: boolean
  loading?: boolean,
  pageCount: number,
  clickIndexPage: (index: number) => void,
  tablePageIndex?: undefined | number,
  skeletonAccount?: number
}

export function PageTable<TData, TValue>({
  columns,
  data,
  needPagination = true,
  loading,
  pageCount,
  clickIndexPage,
  tablePageIndex = undefined,
  skeletonAccount = 3
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
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
  if (table.getState().pagination.pageIndex !== tablePageIndex && tablePageIndex !== undefined) {
    table.setPageIndex(tablePageIndex)
  }
  return (
    <div className="w-full space-y-4">
      <div className="rounded-md border">
        {loading || (!loading && table.getRowModel().rows?.length !== 0) ? (
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
                [...Array(skeletonAccount)].map((_, i) => (
                  <TableRow key={i}>
                    {
                      columns.map((column, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-[50px]" />
                        </TableCell>
                      ))
                    }
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        ) : (
          <>
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
            </Table>
            <div className="flex h-32 items-center justify-center">
              <span className="text-sm text-slate-500">No Data</span>
            </div>
          </>
        )}
      </div>
      {needPagination && data?.length > 0 && (
        <DataTablePagination
          table={table}
          pageCount={pageCount}
          loading={loading}
          clickIndexPage={clickIndexPage}
        />
      )}
    </div>
  )
}
