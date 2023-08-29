'use client';
import * as React from "react"
import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LayoutList, AlignHorizontalJustifyStart, Wallet, BookOpenCheck } from "lucide-react"
import BigNumber from "bignumber.js";
import { useToast } from "@/components/ui/use-toast"
import { gqlReq } from "@/services";
import dayjs from "dayjs";
import { PageTable } from "@/components/page-table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

export default function BlockInfo() {
  const { toast } = useToast()
  const router = useRouter();
  const searchParams = useParams()
  const block = searchParams?.blockNum || ''
  const [blockInfo, setBlockInfo] = useState<any>()
  const [blockId, setBlockId] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageCount, setPageCount] = useState<number>(1)
  const [pageSize, setPageSize] = useState(10)
  const [dataList, setDataList] = useState(Array<any>)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (searchParams?.blockNum) {
      fetch(`/v1/chain/get_block`, {
        next: { revalidate: 10 },
        method: "POST",
        body: JSON.stringify({
          block_num_or_id: block,
        })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setBlockInfo(data)
            if (data?.transactions?.length > 0) {
              setBlockId(data?.id)
              getOrderData(data?.id, pageIndex)
            } else {
              setDataList([])
              setLoading(false)
            }
          } else {
            toast({
              variant: 'destructive',
              title: "Uh oh! Something went wrong",
              description: "Please check if the block number is correct",
            })
          }
        })
    } else {
      toast({
        variant: "destructive",
        title: "Please input block number",
      })
    }
  }, [])

  const getOrderData = (blockId: string, pageIndex: number) => {
    setLoading(true)
    gqlReq('dmc_transactions').count({
      where: {
        and: [
          {
            producer_block_id: blockId
          },
          {
            and: [{
              contract_action: {
                ne: "dmc/onblock",
              }
            }]
          }
        ]
      },
      order: "-id"
    })
      .then((res) => res.json())
      .then((res) => {
        if (res?.data?.count_dmc_transactions) {
          setPageCount(Math.ceil(res?.data?.count_dmc_transactions / pageSize))
        }
      })
    gqlReq('dmc_transactions').find({
      where: {
        and: [
          {
            producer_block_id: blockId
          },
          {
            and: [{
              contract_action: {
                ne: "dmc/onblock",
              }
            }]
          }
        ]
      },
      skip: pageIndex * pageSize,
      limit: pageSize,
      order: "-id"
    }, `
    {
      contract_action
      createdAt
      updatedAt
      id
      producer_block_id
      trx_id
      rawData
    }
    `)
      .then((res) => res.json())
      .then((data: any) => {
        setLoading(false)
        const res = data?.data?.find_dmc_transactions
        if (res) {
          let reformList: any = [];
          res.map((item: any, index: number) => {
            reformList.push({
              key: index,
              id: item?.id,
              trx_id: item?.trx_id,
              time: dayjs(item?.createdAt).format("MMM-DD-YYYY hh:mm:ss A"),
              type: item?.contract_action,
              block_num: item?.rawData?.block_num,
              data: item?.rawData
            });
          });
          setDataList(reformList)
          setLoading(false)
        }
      }).catch((error: any) => {
        setLoading(false)
      })
  }

  const renderResource = () => {
    return (
      <Card>
        <CardHeader className="flex flex-row content-center items-center justify-start space-y-0">
          <AlignHorizontalJustifyStart className="mr-2 text-xl" />
          <CardTitle className="text-xl">
            Block Info
          </CardTitle>
        </CardHeader>
        <CardContent className="grid">
          <div>Time : {dayjs(blockInfo?.timestamp).format("MMM-DD-YYYY hh:mm:ss A")}</div>
          <div>Producer :
            <Button variant="link" onClick={() => router.push(`/resources/${blockInfo?.producer}`)}>
              {blockInfo?.producer}
            </Button>
          </div>
          <div>Block Height :
            <Button variant="link" onClick={() => { }}>
              {blockInfo?.block_num}
            </Button>
          </div>
          <div>Block Hash :
            <Button variant="link" onClick={() => { }}>
              {blockInfo?.id}
            </Button></div>
          <div>Last Block Hash :
            <Button variant="link" onClick={() => { }}>
              {blockInfo?.previous}
            </Button></div>
        </CardContent>
      </Card>
    )
  }

  const columns: any[] = [
    {
      accessorKey: "trx_id",
      header: "TrxId",
      cell: ({ row }: any) => {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div style={{ maxWidth: 120 }} className="overflow-hidden truncate ">{row.getValue("trx_id")}</div>
              </TooltipTrigger>
              <TooltipContent>
                <div>{row.getValue("trx_id")}</div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      }
    },
    // {
    //   accessorKey: "block_num",
    //   header: "Block Num",
    //   cell: ({ row }: any) => {
    //     return (
    //       <Button
    //         variant="link"
    //         className="pl-0"
    //         onClick={() => router.push(`/block-info/${row.getValue("block_num")}`)}
    //       >
    //         {row.getValue("block_num")}
    //       </Button>
    //     )
    //   }
    // },
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "time",
      header: "Time",
    },
    {
      accessorKey: "data",
      header: "Data",
      cell: ({ row }: any) => {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div style={{ maxWidth: 300 }} className="overflow-hidden truncate " > {JSON.stringify(row.getValue("data"))}</div>
              </TooltipTrigger>
              <TooltipContent>
                <div style={{ maxWidth: 600 }} className="overflow-hidden" > {JSON.stringify(row.getValue("data"))}</div >
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      }
    },
  ]

  const renderTrxList = () => {
    return (
      <Card className="mt-5">
        <CardHeader className="flex flex-row content-center items-center justify-between space-y-0">
          <div className="flex flex-row items-center justify-center">
            <LayoutList className="mr-2 text-xl" />
            <CardTitle className="text-xl">
              Trx Lists
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <PageTable
            loading={loading}
            columns={columns}
            data={dataList}
            clickIndexPage={(index: number) => {
              getOrderData(blockId, index)
            }}
            pageCount={pageCount}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <section className="xs:w-screen sm:w-auto">
      {renderResource()}
      {renderTrxList()}
    </section>
  )
}
