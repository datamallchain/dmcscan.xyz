'use client';
import * as React from "react"
import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LayoutList, AlignHorizontalJustifyStart } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { gqlReq } from "@/services";
import dayjs from "dayjs";
import { PageTable } from "@/components/page-table";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "./ui/skeleton";
import dynamic from 'next/dynamic';

export default function TrxInfo() {
  const { toast } = useToast()
  const searchParams = useParams()
  const trxId = searchParams?.trxId || ''
  const [trxInfo, setTrxInfo] = useState<any>()
  const [dataList, setDataList] = useState(Array<any>)
  const [loading, setLoading] = useState(true)
  const [last_irreversible_block_num, set_last_irreversible_block_num] = useState(0)
  const ReactJson = dynamic(() => import('react-json-view'), { ssr: false });

  useEffect(() => {
    if (searchParams?.trxId) {
      getOrderData()
      fetch(`/v1/chain/get_info`, { next: { revalidate: 10 } })
        .then((res) => res.json())
        .then((data) => {
          if (data?.last_irreversible_block_num) {
            set_last_irreversible_block_num(data?.last_irreversible_block_num)
          }
        })
      gqlReq('fibos_transactions').find({
        where: {
          and: [
            {
              trx_id: `${searchParams?.trxId}`
            },
            {
              and: [
                {
                  contract_action: {
                    ne: "dmc/onblock",
                  }
                }
              ]
            }
          ]
        },
        order: "-createdAt"
      }, `
      {
        id
        producer_block_id
        trx_id
        rawData
        contract_action
        createdAt
        updatedAt
        block{
          block_time
          block_num
          status
        }
      }
      `)
        .then((res) => res.json())
        .then((data) => {
          if (data?.data?.find_fibos_transactions?.length > 0) {
            setTrxInfo(data?.data?.find_fibos_transactions[0])
          } else {
            toast({
              variant: 'destructive',
              title: "Uh oh! Something went wrong",
              description: "Please check if the trx id is correct",
            })
          }
        })
    } else {
      toast({
        variant: "destructive",
        title: "Please input trx id",
      })
    }
  }, [])

  const getOrderData = () => {
    setLoading(true)
    gqlReq('fibos_transactions').find({
      where: {
        and: [
          {
            trx_id: trxId
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
    }, `
    {
      id
      producer_block_id
      trx_id
      rawData
      contract_action
      createdAt
      updatedAt
      block{
        block_time
        block_num
        status
      }
    }
    `)
      .then((res) => res.json())
      .then((data: any) => {
        setLoading(false)
        if (data?.data?.find_fibos_transactions) {
          setDataList(data?.data?.find_fibos_transactions)
        }
        setLoading(false)
      }).catch((error: any) => {
        setLoading(false)
      })
  }

  const reformStatus = () => {
    if (trxInfo?.block?.status === "noreversible") {
      return 'Executed/Irreversible'
    } else if (trxInfo?.block?.block_num <= last_irreversible_block_num) {
      return 'rollback'
    } else if (trxInfo?.block?.block_num > last_irreversible_block_num) {
      return 'pending'
    }
    return ''
  }

  const renderResource = () => {
    return (
      <Card>
        <CardHeader className="flex flex-row content-center items-center justify-start space-y-0">
          <AlignHorizontalJustifyStart className="mr-2 text-xl" />
          <CardTitle className="text-xl">
            Trx Info
          </CardTitle>
        </CardHeader>
        <CardContent className="grid">
          <div className="h-9">Transaction : {trxInfo?.trx_id || <Skeleton className="inline-block h-4 w-[200px]" />} </div>
          <div className="h-9">Status : {reformStatus() || <Skeleton className="inline-block h-4 w-[200px]" />}</div>
          <div className="h-9">Block Time : {trxInfo?.block?.block_time && dayjs(trxInfo?.block?.block_time).format("MMM-DD-YYYY hh:mm:ss A") || <Skeleton className="inline-block h-4 w-[200px]" />}</div>
          <div className="h-9">Irreversible Time : {trxInfo?.block?.block_time && dayjs(trxInfo?.block?.block_time).add(parseInt(trxInfo?.rawData?.elapsed)).format("MMM-DD-YYYY hh:mm:ss A") || <Skeleton className="inline-block h-4 w-[200px]" />}</div>
          <div className="h-9">CPU Usage : {trxInfo?.rawData?.receipt?.cpu_usage_us || <Skeleton className="inline-block h-4 w-[200px]" />}</div>
          <div className="h-7">NET Usage : {trxInfo?.rawData?.receipt?.net_usage_words || <Skeleton className="inline-block h-4 w-[200px]" />}</div>
          <div>Block Number :
            <Button className="pl-1" variant="link" onClick={() => { }}>
              {trxInfo?.block?.block_num || <Skeleton className="inline-block h-4 w-[200px]" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderTrxInfo = () => {
    return (
      <Card className="mt-5">
        <CardHeader className="flex flex-row content-center items-center justify-start space-y-0">
          <CardTitle className="text-xl">
            Original Information（Click root to unroll）
          </CardTitle>
        </CardHeader>
        <CardContent className="grid">
          {trxInfo ? (
            <ReactJson
              src={trxInfo}
              collapsed={true}
              style={{
                wordBreak: "break-all",
                wordWrap: "break-word",
              }}
            />
          ) : (
            <Skeleton className="h-6 w-[200px]" />
          )}
        </CardContent>
      </Card>
    )
  }

  const columns: any[] = [
    {
      accessorKey: "contract_action",
      header: "Type",
    },
    {
      accessorKey: "rawData",
      header: "Information",
      cell: ({ row }: any) => {
        return (
          <ReactJson
            style={{
              wordBreak: "break-all",
              wordWrap: "break-word",
            }}
            collapseStringsAfterLength={50}
            src={row.getValue("rawData")}
          />
        )
      }
    }
  ]
  const renderTransactions = () => {
    return (
      <Card className="mt-5">
        <CardHeader className="flex flex-row content-center items-center justify-between space-y-0">
          <div className="flex flex-row items-center justify-center">
            <LayoutList className="mr-2 text-xl" />
            <CardTitle className="text-xl">
              Transactions
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <PageTable
            skeletonAccount={1}
            loading={loading}
            columns={columns}
            data={dataList}
            pageCount={dataList?.length || 0}
            needPagination={false}
            clickIndexPage={() => { }}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <section>
      {renderResource()}
      {renderTrxInfo()}
      {renderTransactions()}
    </section>
  )
}
