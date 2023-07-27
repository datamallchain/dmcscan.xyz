'use client';
import * as React from "react"
import { useState, useEffect } from "react"
import { LayoutList } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { gqlReq } from '@/services/index';
import BigNumber from "bignumber.js";
import dayjs from "dayjs";
import { PageTable } from "@/components/page-table";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { numberToThousands } from "@/lib/utils";

interface RowTypes {
  row: {
    index: number
    location: number
    owner: string
    total_votes: string
    unpaid_blocks: number
    getValue: { (value: string): (any) }
  }
}

export default function OrderList() {
  const router = useRouter();
  const { toast } = useToast()
  const [dataList, setDataList] = useState(Array<any>)
  const [pageCount, setPageCount] = useState<number>(1)
  const [loading, setLoading] = useState(true)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [searchText, setSearchText] = useState('');
  const [tablePageIndex, setTablePageIndex] = useState<any>(undefined)

  const getOrderData = (searchTextLocal: string,) => {
    setLoading(true)
    let where = {}
    if (searchTextLocal) {
      if (searchTextLocal.length === 12) {
        where = {
          and: [
            {
              miner_id: {
                eq: searchTextLocal
              }
            }
          ]
        }
      } else {
        where = {
          or: [
            {
              id: {
                eq: searchTextLocal
              }
            },
            {
              miner_id: {
                eq: searchTextLocal
              }
            }
          ]
        }
      }
    }
    gqlReq('order').count({
      where,
      order: "-created_time",
    })
      .then((res) => res.json())
      .then((res) => {
        if (res?.data?.count_order) {
          setPageCount(Math.ceil(res?.data?.count_order / pageSize))
        }
      })
    gqlReq('order').find({
      where,
      skip: pageIndex * pageSize,
      limit: pageSize,
      order: "-created_time"
    }, `
    {
      id
      user{
          id
      }
      miner{
          id
      }
      bill{
          id
      }
      created_time
      epoch
      user_pledge_amount
      miner_lock_pst_amount
      miner_lock_dmc_amount
      price_amount
      settlement_pledge_amount
      lock_pledge_amount
      state
      deliver_start_date
      latest_settlement_date
      miner_lock_rsi_amount
      miner_rsi_amount
      user_rsi_amount
      deposit_amount
      deposit_valid
      cancel_date
      createdAt
  }
    `)
      .then((res) => res.json())
      .then((data: any) => {
        setLoading(false)
        const res = data?.data?.find_order
        if (res && res.length > 0) {
          setDataList(res)
        } else {
          setDataList([])
        }
      }).catch((error: any) => {
        setLoading(false)
        toast({
          variant: "destructive",
          title: "Something went wrong",
          description: error?.message || "Please try again later.",
        })
      })
  }

  const handleEnterPress = (event: any) => {
    if (event.keyCode === 13) {
      setPageIndex(0)
      getOrderData(searchText)
      setTablePageIndex(0)
    }
  }

  useEffect(() => {
    getOrderData(searchText)
  }, [pageIndex])

  const renderOrderState = (state: any) => {
    if (state === 0) {
      return (
        <div style={{ color: "#EB4C48" }}>
          Failed to reach a consensus
        </div>
      )
    }
    if (!state) {
      return '--'
    }
    if (state !== 4 && state !== 5) {
      return (
        <div style={{ color: "#FF9B3D" }}>
          In progress
        </div>
      )
    }
    return (
      <div>OVER</div>
    )
  }

  const columns: any[] = [
    {
      accessorKey: "id",
      header: "Order Id",
    },
    {
      accessorKey: "miner",
      header: "Miner",
      cell: ({ row }: RowTypes) => {
        return (
          <Button
            variant="link"
            className="pl-0"
            onClick={() => router.push(`/resources/${row.getValue("miner")?.id}`)}
          >
            {row.getValue("miner")?.id}
          </Button>
        )
      }
    },
    {
      accessorKey: "user",
      header: "User",
      cell: ({ row }: RowTypes) => {
        return (
          <Button
            variant="link"
            className="pl-0"
            onClick={() => router.push(`/resources/${row.getValue("user")?.id}`)}
          >
            {row.getValue("user")?.id}
          </Button>
        )
      }
    },
    {
      accessorKey: "price_amount",
      header: "Price (DMC)",
      cell: ({ row }: any) => numberToThousands(new BigNumber(row.getValue("price_amount")).div(row.getValue("miner_lock_pst_amount")).toFixed(4, 1))
    },
    {
      accessorKey: "miner_lock_pst_amount",
      header: "Amount (PST)",
      cell: ({ row }: RowTypes) => numberToThousands(row.getValue("miner_lock_pst_amount"))
    },
    // {
    //   accessorKey: "miner_rsi_amount",
    //   header: "Income",
    // },
    {
      accessorKey: "state",
      header: "State",
      cell: ({ row }: RowTypes) => renderOrderState(row.getValue("state"))
    },
    {
      accessorKey: "created_time",
      header: "Created Time",
      cell: ({ row }: RowTypes) => dayjs(row.getValue("created_time")).format("MMM-DD-YYYY hh:mm:ss A")
    },
  ]
  return (
    <section>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex flex-row items-center justify-center">
            <LayoutList className="mr-2 text-xl" />
            <CardTitle className="text-xl">
              Order Lists
            </CardTitle>
          </div>
          <Input
            className="h-9 md:w-[300px] lg:w-[300px]}"
            value={searchText}
            type="search"
            placeholder="Input Order Id or Miner Id"
            onKeyDown={handleEnterPress}
            onChange={(e) => {
              setPageIndex(0)
              setSearchText(e?.target?.value?.trim())
            }}
          />
        </CardHeader>
        <CardContent>
          <PageTable
            tablePageIndex={tablePageIndex}
            pageCount={pageCount}
            loading={loading}
            columns={columns}
            data={dataList}
            clickIndexPage={(index: number) => {
              setPageIndex(index)
              setTablePageIndex(undefined)
            }}
          />
        </CardContent>
      </Card>
    </section >
  )
}
