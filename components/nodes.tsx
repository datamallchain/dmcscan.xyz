'use client';
import * as React from "react"
import { useState, useEffect } from "react"
import countriesCodes from 'iso-3166-1-codes'
import { emoji, numberToThousands } from "@/lib/utils";
import { PageTable } from "@/components/page-table";
import { LayoutList, NetworkIcon } from "lucide-react"
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
import BigNumber from "bignumber.js";

interface RowTypes {
  row: {
    index: number
    location: number
    owner: string
    total_votes: string
    unpaid_blocks: number
    getValue: { (value: string): (string) }
  }
}

export default function Nodes({ isSummary = false }) {
  const router = useRouter();
  const { toast } = useToast()
  const [nodeList, setNodeList] = useState(Array<any>)
  const [dataList, setDataList] = useState(Array<any>)
  const byNumeric = countriesCodes.byNumeric();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true)
  const [pageCount, setPageCount] = useState<number>(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageIndex, setPageIndex] = useState(0)
  const [tablePageIndex, setTablePageIndex] = useState<any>(undefined)

  useEffect(() => {
    getProducers("0", [])
  }, [])
  const getProducers = (lower_bound: string, last_list: Array<any>) => {
    fetch("/v1/chain/get_table_rows", {
      method: "POST",
      body: JSON.stringify({
        code: "dmc",
        json: true,
        limit: 100,
        lower_bound,
        scope: "dmc",
        table: "producers"
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.more) {
          getProducers(data.next_key, last_list.concat(data.rows))
        } else {
          setLoading(false)
          const ordersData = last_list.concat(data.rows).sort((i: any, j: any) => Number(j.total_votes) - Number(i.total_votes))
          setNodeList(ordersData)
          setDataList(ordersData.slice(0, pageSize))
          setPageCount(Math.ceil(last_list.concat(data.rows).length / pageSize))
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

  const renderFlag = (locationNumber: any) => {
    if (!locationNumber) {
      return '--'
    }
    const locationNumberString = locationNumber.toString().padStart(3, 0)
    const isValid = byNumeric.has(locationNumberString)
    let alpha2Code, name
    if (isValid) {
      alpha2Code = byNumeric.get(locationNumberString).alpha2
      name = byNumeric.get(locationNumberString).name
    }
    return isValid ? (
      <div style={{ display: "flex", alignItems: "center" }}>
        {emoji(alpha2Code)}
        <span className="ml-1">{name}</span>
      </div>
    ) : (
      "--"
    );
  }
  const columns: any[] = [
    {
      accessorKey: "index",
      header: "Rank",
      cell: ({ row }: RowTypes) => {
        if (nodeList?.length === 1) {
          return '--'
        }
        return (
          (pageIndex * pageSize + row.index) < 21 ? (
            <div className="flex flex-row items-center">
              <NetworkIcon className="mr-1 h-4 w-4" />
              <div>{(pageIndex * pageSize + row.index + 1)}</div>
            </div>
          ) : ((pageIndex * pageSize + row.index + 1))
        )
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
      accessorKey: "total_votes",
      header: "PST",
      cell: ({ row }: RowTypes) => numberToThousands(Number(row.getValue("total_votes")).toFixed(0))
    },
    {
      accessorKey: "unpaid_blocks",
      header: "Unclaimed",
      cell: ({ row }: RowTypes) => numberToThousands(new BigNumber(row.getValue("unpaid_blocks")).toFixed())
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }: RowTypes) => renderFlag(row.getValue("location"))
    },
  ]

  const handleEnterPress = (event: any) => {
    if (event.keyCode === 13) {
      setLoading(true)
      setPageIndex(0)
      setTablePageIndex(0)
      if (searchText) {
        fetch("/v1/chain/get_table_rows", {
          method: "POST",
          body: JSON.stringify({
            code: "dmc",
            json: true,
            limit: 1,
            lower_bound: searchText,
            upper_bound: searchText,
            scope: "dmc",
            table: "producers"
          })
        })
          .then((res) => res.json())
          .then((data) => {
            setLoading(false)
            if (data?.rows?.length > 0) {
              setNodeList(data.rows)
              setDataList(data.rows.slice(0, pageSize))
              setPageCount(1)
            } else {
              setNodeList([])
              setDataList([])
              setPageCount(1)
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
        getProducers("0", [])
      }
    }
  }

  return (
    <section>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex flex-row items-center justify-center">
            <LayoutList className="mr-2 text-xl" />
            <CardTitle className="text-xl">
              Top Nodes
            </CardTitle>
          </div>
          {isSummary ? (
            <Button
              className="h-7 rounded-full"
              variant="outline"
              onClick={() => router.push('/nodes')}
            > More</Button>
          ) : (
            <Input
              className="h-9 md:w-[300px] lg:w-[300px]}"
              value={searchText}
              type="search"
              placeholder="Input Node Name"
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
              const data = nodeList.slice(index * pageSize, (index + 1) * pageSize)
              setPageIndex(index)
              setTablePageIndex(undefined)
              setDataList(data)
              setTimeout(() => {
                setLoading(false)
              }, 300);
            }}
            loading={loading}
            columns={columns}
            data={dataList}
            tablePageIndex={tablePageIndex}
            needPagination={!isSummary}
          />
        </CardContent>
      </Card>
    </section >
  )
}
