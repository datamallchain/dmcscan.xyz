import * as React from "react"
import { Table } from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import BigNumber from "bignumber.js"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@radix-ui/react-label"
import { isMobile } from "@/lib/utils"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  loading?: boolean,
  pageCount: number,
  clickIndexPage: (index: number) => void,
}

export function DataTablePagination<TData>({
  table,
  loading,
  pageCount,
  clickIndexPage
}: DataTablePaginationProps<TData>) {
  const [pageIndex, setPageIndex] = useState<any>('')
  const { toast } = useToast()
  const defaultPages = isMobile() ? 3 : 5
  const handleEnterPress = (event: any) => {
    if (event.keyCode === 13) {
      if (pageIndex && new BigNumber(pageIndex).isInteger() && pageIndex >= 1 && pageIndex < (pageCount + 1)) {
        clickIndexPage(pageIndex - 1);
        table.setPageIndex(pageIndex - 1);
      } else {
        toast({
          variant: "destructive",
          title: "Please enter a valid page number",
        })
      }
    }
  }
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          {defaultPages !== 3 && (
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => { clickIndexPage(table.getState().pagination.pageIndex - 1); table.setPageIndex(table.getState().pagination.pageIndex - 1); }}
              disabled={table.getState().pagination.pageIndex === 0 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant={'outline'}
            className="h-8 w-8 p-0"
            onClick={() => { clickIndexPage(0); table.setPageIndex(0); }}
            disabled={0 === table.getState().pagination.pageIndex || loading}
          >
            1
          </Button>
          {table.getState().pagination.pageIndex > 2 && <MoreHorizontal className="h-4 w-4" />}
          {
            pageCount && Array.from(
              { length: pageCount > defaultPages ? defaultPages : pageCount }, (_, i) => {
                if (table.getState().pagination.pageIndex < 2) {
                  return i
                } else if (table.getState().pagination.pageIndex > (pageCount - 2)) {
                  return pageCount - defaultPages + i
                } else {
                  return table.getState().pagination.pageIndex - 1 + i
                }
              }
            ).map((item) =>
            (
              (item !== 0 && item !== (pageCount - 1)) && <Button
                key={item}
                variant={'outline'}
                className="h-8 w-8 p-0"
                onClick={() => { clickIndexPage(item); table.setPageIndex(item); }}
                disabled={item === (table.getState().pagination.pageIndex) || loading}
              >
                {item + 1}
              </Button>
            )
            )
          }
          {table.getState().pagination.pageIndex < (pageCount - defaultPages) && <MoreHorizontal className="h-4 w-4" />}
          {
            pageCount > 1 && (
              <Button
                variant={'outline'}
                className="h-8 w-8 p-0"
                onClick={() => { clickIndexPage(pageCount - 1); table.setPageIndex(pageCount - 1); }}
                disabled={pageCount === (table.getState().pagination.pageIndex + 1) || loading}
              >
                {pageCount}
              </Button>
            )
          }
          {defaultPages !== 3 && (
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => { clickIndexPage(table.getState().pagination.pageIndex + 1); table.setPageIndex(table.getState().pagination.pageIndex + 1); }}
              disabled={pageCount === (table.getState().pagination.pageIndex + 1) || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Label>Go to</Label>
        <Input
          style={{ marginLeft: 10 }}
          className="h-9 xs:w-[40px] md:w-[50px] lg:w-[50px]} ml-0"
          value={pageIndex}
          placeholder=""
          onKeyDown={handleEnterPress}
          onChange={(e) => {
            setPageIndex(e?.target?.value?.trim())
          }}
        />
      </div>
    </div>
  )
}
