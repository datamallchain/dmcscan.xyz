'use client';
import * as React from "react"
import { useState, useEffect } from "react"
import { Globe2, FileJson2 } from "lucide-react"
import dayjs from "dayjs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import BigNumber from "bignumber.js"
import { Button } from "@/components/ui/button";
import { gqlReq } from "@/services";
import { useRouter } from 'next/navigation';
import { numberToThousands } from "@/lib/utils";

interface ChainInfo {
  head_block_num: number,
  head_block_time: string,
  head_block_producer: string,
  last_irreversible_block_num: number,
  last_irreversible_block_time: string,
}

export default function Overview() {
  const router = useRouter()
  const [chainInfo, setChainInfo] = useState<ChainInfo>({
    head_block_num: 0,
    head_block_time: '',
    head_block_producer: '',
    last_irreversible_block_num: 0,
    last_irreversible_block_time: '',
  })
  const [ramPrice, setRamPrice] = useState<any>()
  const [cpuPrice, setCpuPrice] = useState<any>()
  const [netPrice, setNetPrice] = useState<any>()
  const [dmcProduction, setDmcProduction] = useState<any>(undefined)
  const [orderLockedPstTotal, setOrderLockedPstTotal] = useState<any>(undefined)
  const [supplyPst, setSupplyPst] = useState<any>(0)
  const [underGoingPst, setUnderGoingPst] = useState<any>(0)
  const [underGoingDmc, setUnderGoingDmc] = useState<any>(0)
  const [transactionComputingAvg, setTransactionComputingAvg] = useState<any>(0)
  const [finishedPST, setFinishedPST] = useState<any>(0)
  const [avgStakeRate, setAvgStakeRate] = useState<any>(undefined)
  const [oneDayUserReward, setOneDayUserReward] = useState<any>(undefined)
  const [oneDayMinerReward, setOneDayMinerReward] = useState<any>(undefined)
  const [accountTotal, setAccountTotal] = useState<any>(undefined)


  let requestInterval: any
  let orderRequestInterval: any

  useEffect(() => {
    const fetchData = async () => {
      try {
        // load cache data
        fetch('/api/orders')
          .then((res) => res.json())
          .then((totalData) => {
            if (totalData?.data) {
              let avgTotal = new BigNumber(0)
              let orderLockedPstTotal = new BigNumber(0)
              let underGoingPST = new BigNumber(0)
              let underGoingDmc = new BigNumber(0)
              let finishedPST = new BigNumber(0)
              totalData?.data.forEach((item: any) => {
                avgTotal = new BigNumber(avgTotal).plus(item?.maker_snapshot[0]?.rate)
                orderLockedPstTotal = new BigNumber(orderLockedPstTotal).plus(item?.miner_lock_pst_amount)
                if (item?.state !== 4 && item?.state !== 5) {
                  underGoingPST = new BigNumber(underGoingPST).plus(item?.miner_lock_pst_amount)
                  underGoingDmc = new BigNumber(underGoingDmc).plus(item?.miner_lock_dmc_amount)
                } else {
                  finishedPST = new BigNumber(finishedPST).plus(item?.miner_lock_pst_amount)
                }
              })
              setOrderLockedPstTotal(orderLockedPstTotal.div(1024).toFixed())
              setFinishedPST(finishedPST.toFixed(0, 1))
              setUnderGoingPst(underGoingPST.toFixed(0, 1))
              setUnderGoingDmc(underGoingDmc.toFixed(0, 1))
            } else {
              getOrderData(0, [])
            }
          })
      } catch (error) {
        getOrderData(0, [])
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (underGoingDmc && underGoingPst) {
      setTransactionComputingAvg(new BigNumber(underGoingDmc).div(underGoingPst).times(1024).toFixed(4, 1))
    }
  }, [underGoingDmc, underGoingPst])

  useEffect(() => {
    if (dmcProduction && avgStakeRate && orderLockedPstTotal) {
      const allRate = new BigNumber(2).plus(avgStakeRate)
      const userRate = new BigNumber(1).plus(avgStakeRate)
      setOneDayUserReward(new BigNumber(dmcProduction).div(allRate).div(orderLockedPstTotal).toFixed(4, 1))
      setOneDayMinerReward(new BigNumber(dmcProduction).div(allRate).div(orderLockedPstTotal).times(userRate).toFixed(4, 1))
    }
  }, [dmcProduction, avgStakeRate, orderLockedPstTotal])

  const getAccount = () => {
    gqlReq('account').count({
      skip: 0,
    }, `
    {id}
    `)
      .then((res) => res.json())
      .then((res) => {
        if (res?.data?.count_account) {
          setAccountTotal(res?.data?.count_account)
        }
      })
  }

  const getOrderData = (skip: number, lastData: any) => {
    const pageSize = 500
    gqlReq('order').find({
      skip,
      limit: pageSize,
      order: "-created_time"
    }, `
    {
      miner_lock_dmc_amount
      miner_lock_pst_amount
      state
      lock_pledge_amount
      maker_snapshot {
        rate
     }
  }
    `)
      .then((res) => res.json())
      .then((data: any) => {
        const res = data?.data?.find_order
        if (res) {
          const totalData = lastData.concat(res)
          if (res.length === pageSize) {
            getOrderData(skip + res.length, totalData)
          } else {
            let avgTotal = new BigNumber(0)
            let orderLockedPstTotal = new BigNumber(0)
            let underGoingPST = new BigNumber(0)
            let underGoingDmc = new BigNumber(0)
            let finishedPST = new BigNumber(0)
            totalData.forEach((item: any) => {
              avgTotal = new BigNumber(avgTotal).plus(item?.maker_snapshot[0]?.rate)
              orderLockedPstTotal = new BigNumber(orderLockedPstTotal).plus(item?.miner_lock_pst_amount)
              if (item?.state !== 4 && item?.state !== 5) {
                underGoingPST = new BigNumber(underGoingPST).plus(item?.miner_lock_pst_amount)
                underGoingDmc = new BigNumber(underGoingDmc).plus(item?.miner_lock_dmc_amount)
              } else {
                finishedPST = new BigNumber(finishedPST).plus(item?.miner_lock_pst_amount)
              }
            })
            setOrderLockedPstTotal(orderLockedPstTotal.div(1024).toFixed())
            setFinishedPST(finishedPST.toFixed(0, 1))
            setUnderGoingPst(underGoingPST.toFixed(0, 1))
            setUnderGoingDmc(underGoingDmc.toFixed(0, 1))
          }
        }
      }).catch((error: any) => {

      })
  }

  const getOverView = () => {
    fetch(`/v1/chain/get_info`, { next: { revalidate: 10 } })
      .then((res) => res.json())
      .then((data) => {
        setChainInfo(data)
      })
    fetch(`/v1/chain/get_table_rows`, {
      next: { revalidate: 10 },
      method: "POST",
      body: JSON.stringify({
        json: true,
        code: "dmc",
        scope: "dmc",
        table: "rammarket"
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.rows?.length > 0) {
          const { base, quote } = data.rows[0]
          setRamPrice(new BigNumber(quote.balance.split(" ")[0]).times(1024).div(base.balance.split(" ")[0]).toFixed(10, 1))
        }
      })
    fetch(`/v1/chain/get_account`, {
      next: { revalidate: 10 },
      method: "POST",
      body: JSON.stringify({
        account_name: 'speakfool123',
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          const { cpu_limit, cpu_weight, net_limit, net_weight } = data
          setCpuPrice(new BigNumber(cpu_weight).div(10000).div(cpu_limit.max).times(1024).toFixed(10, 1))
          setNetPrice(new BigNumber(net_weight).div(10000).div(net_limit.max).times(1024).toFixed(10, 1))
        }
      })
    fetch(`/v1/chain/get_table_rows`, {
      next: { revalidate: 10 },
      method: "POST",
      body: JSON.stringify({
        json: true,
        code: "dmc.token",
        scope: "datamall",
        table: "stats"
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.rows?.length > 0) {
          const pstItem = data?.rows?.find((item: any) => item?.supply?.split(' ')[1] === 'PST' && item?.issuer === 'datamall')
          setSupplyPst(pstItem?.supply?.split(' ')[0])
        }
      })
    fetch(`/innerUniswapTrade`, {
      next: { revalidate: 10 },
      method: "POST",
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'quiet'
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.DMCTotal) {
          setDmcProduction(data?.DMCTotal.split(' ')[0])
        }
      })
    fetch(`/checkAvgStakeRate`, {
      next: { revalidate: 10 },
      method: "POST",
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        states: 'underGoing'
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.avgStakeRate) {
          setAvgStakeRate(data?.avgStakeRate / 100)
        }
      })
  }

  useEffect(() => {
    getAccount()
    // getOrderData(0, [])
    getOverView()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    requestInterval = setInterval(() => {
      getOverView()
    }, 3000)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    orderRequestInterval = setInterval(() => {
      // getOrderData(0, [])
      getAccount()
    }, 60000)
    return () => {
      requestInterval && clearInterval(requestInterval)
      orderRequestInterval && clearInterval(orderRequestInterval)
    }
  }, [])

  const renderOverview = () => {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex flex-row items-center justify-center">
            <Globe2 className="mr-2 text-xl" />
            <CardTitle className="text-xl">
              Overview
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Block Height
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="link"
                className="p-0"
                onClick={() => {
                  if (chainInfo?.head_block_num) {
                    router.push(`/block-info/${chainInfo?.head_block_num}`)
                  }
                }}
              >
                {
                  chainInfo?.head_block_num ? <div className="text-2xl font-bold">{chainInfo?.head_block_num}</div> : <Skeleton className="h-6 w-[200px]" />
                }
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Latest Block Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {
                chainInfo?.head_block_time ? <div className="text-2xl font-bold">{dayjs(chainInfo?.head_block_time).format("MMM-DD-YYYY hh:mm:ss A")}</div> : <Skeleton className="h-6 w-[200px]" />
              }
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Irreversible Block Height
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="link"
                className="p-0"
                onClick={() => {
                  if (chainInfo?.last_irreversible_block_num) {
                    router.push(`/block-info/${chainInfo?.last_irreversible_block_num}`)
                  }
                }}
              >
                {
                  chainInfo?.last_irreversible_block_num ? <div className="text-2xl font-bold">{chainInfo?.last_irreversible_block_num}</div> : <Skeleton className="h-6 w-[200px]" />
                }
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Irreversible Block Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {
                chainInfo?.last_irreversible_block_time ? <div className="text-2xl font-bold">{dayjs(chainInfo?.last_irreversible_block_time).format("MMM-DD-YYYY hh:mm:ss A")}</div> : <Skeleton className="h-6 w-[200px]" />
              }
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Block Producer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="link"
                className="p-0"
                onClick={() => {
                  if (chainInfo?.head_block_producer) {
                    router.push(`/resources/${chainInfo?.head_block_producer}`)
                  }
                }}
              >
                {
                  chainInfo?.head_block_producer ? <div className="text-2xl font-bold">{chainInfo?.head_block_producer}</div> : <Skeleton className="h-6 w-[200px]" />
                }
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accountTotal ? <div className="text-2xl font-bold">{numberToThousands(accountTotal)}</div> : <Skeleton className="h-6 w-[200px]" />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ram Price (DMC/KB)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ramPrice ? <div className="text-2xl font-bold">{ramPrice}</div> : <Skeleton className="h-6 w-[200px]" />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                CPU Stake Price (DMC/MS)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cpuPrice ? <div className="text-2xl font-bold">{cpuPrice}</div> : <Skeleton className="h-6 w-[200px]" />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Net Stake Price (DMC/KB)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {netPrice ? <div className="text-2xl font-bold">{netPrice}</div> : <Skeleton className="h-6 w-[200px]" />}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    )
  }

  const renderEcosystem = () => {
    return (
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex flex-row items-center justify-center">
            <FileJson2 className="mr-2 text-xl" />
            <CardTitle className="text-xl">
              Ecosystem
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                24h DMC Production (DMC)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dmcProduction ? <div className="text-2xl font-bold">{numberToThousands(dmcProduction)}</div> : <Skeleton className="h-6 w-[200px]" />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Transaction Computing Power Average Pledge (DMC/TB)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactionComputingAvg ? <div className="text-2xl font-bold">{numberToThousands(new BigNumber(transactionComputingAvg).toFixed(4, 1))}</div> : <Skeleton className="h-6 w-[200px]" />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Pending Storage Space (TB)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {supplyPst ? <div className="text-2xl font-bold">{numberToThousands(new BigNumber(supplyPst).div(1024).toFixed(0, 1))}</div> : <Skeleton className="h-6 w-[200px]" />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Effective Storage Space (TB)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {underGoingPst ? <div className="text-2xl font-bold">{numberToThousands(new BigNumber(underGoingPst).div(1024).toFixed(0, 1))}</div> : <Skeleton className="h-6 w-[200px]" />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Historical Traded Storage Space (TB)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {finishedPST ? <div className="text-2xl font-bold">{numberToThousands(new BigNumber(finishedPST).div(1024).toFixed(0, 1))}</div> : <Skeleton className="h-6 w-[200px]" />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                24h Miner Income (DMC/TB)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {oneDayMinerReward ? <div className="text-2xl font-bold">{numberToThousands(oneDayMinerReward)}</div> : <Skeleton className="h-6 w-[200px]" />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                24h User Income (DMC/TB)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {oneDayUserReward ? <div className="text-2xl font-bold">{numberToThousands(oneDayUserReward)}</div> : <Skeleton className="h-6 w-[200px]" />}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    )
  }

  return (
    <section>
      {renderOverview()}
      {renderEcosystem()}
    </section>
  )
}
