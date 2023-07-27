'use client';
import * as React from "react"
import { useState, useEffect } from "react"
import { PageTable } from "@/components/page-table";
import { Server } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { numberToThousands } from "@/lib/utils";

interface RowTypes {
  row: {
    index: number
    owner: string
    amount: {
      quantity: string
      contract: string
    }
    getValue: { (value: string): (any) }
  }
}

export default function PstList({ isSummary = false }) {
  const router = useRouter();
  const { toast } = useToast()
  const [pstList, setPstList] = useState(Array<any>)
  const [pageCount, setPageCount] = useState<number>(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageIndex, setPageIndex] = useState(0)
  const [tablePageIndex, setTablePageIndex] = useState<any>(undefined)
  const [dataList, setDataList] = useState(Array<any>)
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPstStats("0", [])
  }, [])
  const getPstStats = (lower_bound: string, last_list: Array<any>) => {
    fetch("/v1/chain/get_table_rows", {
      method: "POST",
      body: JSON.stringify({
        code: "dmc.token",
        json: true,
        limit: 1000,
        scope: "dmc.token",
        table: "pststats",
        lower_bound
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.more && !isSummary) {
          getPstStats(data.next_key, last_list.concat(data.rows))
        } else {
          setLoading(false)
          const reformDs = last_list.concat(data.rows).sort((i: any, j: any) => Number(j.amount?.quantity?.split(' ')[0]) - Number(i.amount?.quantity?.split(' ')[0]))
          setPstList(reformDs)
          setDataList(reformDs.slice(0, pageSize))
          setPageCount(Math.ceil(reformDs.length / pageSize))
        }
      })
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "Something went wrong",
          description: error?.message || "Please try again later.",
        })
      })
  }

  const handleEnterPress = (event: any) => {
    if (event.keyCode === 13) {
      setLoading(true)
      setPageIndex(0)
      setTablePageIndex(0)
      if (searchText) {
        fetch("/v1/chain/get_table_rows", {
          method: "POST",
          body: JSON.stringify({
            code: "dmc.token",
            json: true,
            limit: 1,
            lower_bound: searchText,
            upper_bound: searchText,
            scope: "dmc.token",
            table: "pststats",
          })
        })
          .then((res) => res.json())
          .then((data) => {
            setLoading(false)
            if (data?.rows?.length > 0) {
              setPstList(data.rows)
              setDataList(data.rows.slice(0, pageSize))
              setPageCount(1)
            } else {
              setPstList([])
              setPageCount(1)
              setDataList([])
            }
          })
          .catch((error) => {
            setLoading(false)
            toast({
              variant: "destructive",
              title: "Something went wrong",
              description: error?.message || "Please try again later.",
            })
          })
      } else {
        getPstStats("0", [])
      }
    }
  }

  const columns: any[] = [
    {
      accessorKey: "index",
      header: "Rank",
      cell: ({ row }: RowTypes) => {
        if (pstList?.length === 1) {
          return '--'
        }
        return ((pageIndex * pageSize + row.index + 1))
      }
    },
    {
      accessorKey: "owner",
      header: "Account",
      cell: ({ row }: RowTypes) => {
        return (
          <Button
            variant="link"
            className="pl-0"
            onClick={() => router.push(`/resources/${row.getValue("owner")}`)}
          >
            {row.getValue("owner")}
          </Button>
        )
      }
    },
    {
      accessorKey: "amount",
      header: "PST",
      cell: ({ row }: RowTypes) => numberToThousands(row.getValue("amount")?.quantity?.split(' ')[0])
    },
    // {
    //   accessorKey: "unpaid_blocks",
    //   header: "Unclaimed",
    // },
    // {
    //   accessorKey: "location",
    //   header: "Location",
    //   cell: ({ row }: RowTypes) => renderFlag(row.getValue("location"))
    // },
  ]

  return (
    <section>
      <Card>
        <CardHeader className="flex flex-row content-center items-center justify-between space-y-0">
          <div className="flex flex-row items-center justify-center">
            <Server className="mr-2 text-xl" />
            <CardTitle className="text-xl">
              Top Miners
            </CardTitle>
          </div>
          {isSummary ? (
            <Button
              className="h-7 rounded-full"
              variant="outline"
              onClick={() => router.push('/pst-list')}
            > More</Button>
          ) : (
            <Input
              className="h-9 md:w-[300px] lg:w-[300px]}"
              value={searchText}
              type="search"
              placeholder="Input Miner Name"
              onKeyDown={handleEnterPress}
              onChange={(e) => {
                setSearchText(e?.target?.value?.trim())
              }}
            />
          )}
        </CardHeader>
        <CardContent>
          <PageTable
            pageCount={pageCount}
            clickIndexPage={(index: number) => {
              setLoading(true)
              const data = pstList.slice(index * pageSize, (index + 1) * pageSize)
              setPageIndex(index)
              setTablePageIndex(undefined)
              setDataList(data)
              setTimeout(() => {
                setLoading(false)
              }, 300);
            }}
            tablePageIndex={tablePageIndex}
            loading={loading}
            columns={columns}
            data={dataList}
            needPagination={!isSummary}
          />
        </CardContent>
      </Card>
    </section >
  )
}
