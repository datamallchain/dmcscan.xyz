'use client';
import * as React from "react"
import { useState, useEffect, useContext } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { LayoutList, PieChart, Wallet, BookOpenCheck, User } from "lucide-react"
import BigNumber from "bignumber.js";
import { Progress } from "@/components/ui/progress"
import { cpuSizeFormat, netSizeFormat, numberToThousands, ramSizeFormat, reformAccount, reformAmount } from "@/lib/utils";
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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { Label } from "@radix-ui/react-label";

export default function Resources() {
  const { toast } = useToast()
  const router = useRouter();
  const searchParams = useParams()
  const [account, setAccount] = useState(searchParams.account || '')
  const [accountInfo, setAccountInfo] = useState<any>()
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [dataList, setDataList] = useState(Array<any>)
  const [pageCount, setPageCount] = useState<number>(1)
  const [pagesList, setPagesList] = useState<Array<any>>([Number.MAX_SAFE_INTEGER.toString()])
  const [loading, setLoading] = useState(true)
  const [assetsList, setAssetsList] = useState(Array<any>)
  const [lockAssetsList, setLockAssetsList] = useState(Array<any>)
  const [dmcLockedkAmount, setDmcLockedkAmount] = useState(0)
  const [dmcStakedAmount, setDmcStakedAmount] = useState(0)
  const [dmc_lock_pledge_amount, setDmc_lock_pledge_amount] = useState('0')
  const [dmcStakedTotal, setDmcStakedTotal] = useState('')
  const [pstTotal, setPstTotal] = useState(0)
  const [pstUnderGoing, setPstUnderGoing] = useState(0)
  const [pstUnMatched, setPstUnMatched] = useState(0)

  useEffect(() => {
    if (!searchParams.account && sessionStorage?.getItem('account')) {
      setAccount(sessionStorage?.getItem('account') || '')
    }
  }, [searchParams])

  useEffect(() => {
    setDmcStakedTotal(new BigNumber(dmcStakedAmount).plus(dmc_lock_pledge_amount).toFixed(4, 1))
  }, [dmcStakedAmount, dmc_lock_pledge_amount])

  useEffect(() => {
    if (account) {
      getAssetsData()
      getPstAmount()
      getLockAssetsData()
      getOrderData()
      get_dmc_lock_pledge_amount([], 0)
      fetch(`/v1/chain/get_account`, {
        next: { revalidate: 10 },
        method: "POST",
        body: JSON.stringify({
          account_name: account,
        })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.account_name) {
            setAccountInfo(data)
          } else {
            toast({
              variant: 'destructive',
              title: "Uh oh! Something went wrong",
              description: "Please check if the account name is correct",
            })
          }
        })
    } else if (!sessionStorage?.getItem('account')) {
      setLoading(false)
      toast({
        variant: "destructive",
        title: "Please login first or input account name",
      })
    }
  }, [account, pageIndex])

  const getPstAmount = () => {
    fetch(`/obtainPSTHolding`, {
      next: { revalidate: 10 },
      method: "POST",
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.list) {
          const userData = data.list.filter((e: any) => e.account === account)
          if (userData && userData.length > 0) {
            setPstTotal(userData[0].total)
            setPstUnderGoing(userData[0].underGoing)
            setPstUnMatched(userData[0].unMatched)
          }
        }
      })
  }

  const get_dmc_lock_pledge_amount = (lastData: any, skip: number = 0) => {
    const limit = 500
    gqlReq('order').find({
      where: {
        and: [
          {
            miner_id: {
              eq: account
            }
          }
        ]
      },
      skip,
      limit,
      order: "-created_time"
    }, `
    {
      miner_lock_dmc_amount
  }
    `)
      .then((res) => res.json())
      .then((res: any) => {
        console.log('res: ', res)
        const data = lastData.concat(res?.data?.find_order)
        if (res?.data?.find_order?.length === limit) {
          get_dmc_lock_pledge_amount(data, skip + limit)
        } else {
          let miner_lock_dmc_amount = new BigNumber(0)
          for (let i = 0; i < data.length; i++) {
            miner_lock_dmc_amount = new BigNumber(miner_lock_dmc_amount).plus(data[i]?.miner_lock_dmc_amount)
          }
          setDmc_lock_pledge_amount(miner_lock_dmc_amount.toFixed(4, 1))
        }
      })
  }

  const getDmcPoolData = (makers: []) => {
    Promise.all(
      makers.map((maker: any) => maker.id)
        .map((miner) => {
          return Promise.all([
            fetch("/v1/chain/get_table_rows", {
              method: "POST",
              body: JSON.stringify({
                code: "dmc.token",
                table: "dmcmaker",
                scope: "dmc.token",
                json: true,
                lower_bound: `${reformAccount(miner)}`,
                upper_bound: `${reformAccount(miner)}`,
              })
            }).then((res) => res.json()),
            fetch("/v1/chain/get_table_rows", {
              method: "POST",
              body: JSON.stringify({
                code: "dmc.token",
                table: "makerpool",
                scope: `${reformAccount(miner)}`,
                json: true,
              })
            }).then((res) => res.json()),
          ]);
        })
    )
      .then((res) => {
        const tableData = res.map((item: any) => {
          const totalWeight = item[0].rows[0]?.total_weight;
          const totalQuantity =
            item[0].rows[0]?.total_staked.quantity.split(
              " "
            )[0];
          const ownerWeight = item[1].rows.filter((item: any) => {
            return item.owner === account;
          })[0]?.weight;
          const quantity = reformAmount(
            new BigNumber(ownerWeight)
              .div(totalWeight)
              .times(totalQuantity),
            4
          );
          return {
            quantity:
              item[0]?.rows[0] && ownerWeight ? quantity : "0",
          };
        });
        let totalStake: any = [];
        tableData.map((item) => {
          totalStake.push(item.quantity);
        });
        const sum = totalStake.reduce((pre: any, cur: any) => {
          return new BigNumber(pre)
            .plus(cur)
            .toFixed(4);
        }, 0);
        setDmcStakedAmount(sum)
      })
      .catch((err) => {

      });
  }

  const getAssetsData = () => {
    fetch("/v1/chain/get_table_rows", {
      method: "POST",
      body: JSON.stringify({
        code: "dmc.token",
        json: true,
        limit: 1000,
        scope: reformAccount(account!),
        table: "accounts",
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.rows) {
          setAssetsList(data?.rows)
        }
      })
      .catch((error) => {

      })

    gqlReq('account').find({
      where: {
        id: account
      },
    }, `
    {
      lp_maker {
        id
      }
    }
    `)
      .then((res) => res.json())
      .then((res: any) => {
        if (res?.data?.find_account[0]?.lp_maker?.length > 0) {
          getDmcPoolData(res?.data?.find_account[0]?.lp_maker)
        }
      })
  }

  const getLockAssetsData = () => {
    fetch("/v1/chain/get_table_rows", {
      method: "POST",
      body: JSON.stringify({
        code: "dmc.token",
        json: true,
        limit: 1000,
        scope: reformAccount(account!),
        table: "lockaccounts",
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.rows) {
          let dmcLocked = 0
          let pstLocked = 0
          const lockedTokens: any = []
          data?.rows.forEach((row: any) => {
            if (row?.balance?.contract === 'datamall' && row?.balance?.quantity?.split(' ')[1] === 'DMC') {
              dmcLocked += Number(row?.balance?.quantity?.split(' ')[0])
            }
            if (row?.balance?.contract === 'datamall' && row?.balance?.quantity?.split(' ')[1] === 'PST') {
              pstLocked += Number(row?.balance?.quantity?.split(' ')[0])
            } else {
              lockedTokens.push(row)
            }
          });
          setDmcLockedkAmount(dmcLocked)
          setLockAssetsList(lockedTokens)
        }
      })
      .catch((error) => {

      })
  }

  const getOrderData = () => {
    setLoading(true)
    gqlReq('tokens_action').count({
      where: {
        and: [
          {
            or: [
              {
                account_from_id: account
              },
              {
                account_to_id: account
              }
            ]
          }
        ]
      },
      order: "-created_time"
    })
      .then((res) => res.json())
      .then((res) => {
        if (res?.data?.count_tokens_action) {
          setPageCount(Math.ceil(res?.data?.count_tokens_action / pageSize))
        }
      })
    gqlReq('tokens_action').find({
      where: {
        and: [
          {
            or: [
              {
                account_from_id: account
              },
              {
                account_to_id: account
              }
            ]
          }
        ]
      },
      skip: pageIndex * pageSize,
      limit: pageSize,
      order: "-id"
    }, `
    {
        account_from{
      id
    }
      account_to{
      id
    }
      contract_action
      action{
      rawData
    }
      token_from{
      token_name
        token_type
        token_status
    }
      token_to{
      token_name
        token_type
        token_status
    }
      id
    }
  `)
      .then((res) => res.json())
      .then((data: any) => {
        setLoading(false)
        const res = data?.data?.find_tokens_action
        if (res) {
          let reformList: any = [];
          res.map((item: any, index: number) => {
            if (item.action && item.action.rawData) {
              reformList.push({
                key: index,
                id: item.id,
                trx_id: item.action.rawData.trx_id,
                time: dayjs(item.action.rawData.block_time).format("MMM-DD-YYYY hh:mm:ss A"),
                type: item.contract_action,
                actData: item.action.rawData.act.data,
                block_num: item.action.rawData.block_num,
                data:
                  item.action.rawData.act.data.from &&
                    item.action.rawData.act.data.quantity
                    ? [
                      item.action.rawData.act.data.from,
                      item.action.rawData.act.data.to,
                      item.action.rawData.act.data.quantity.quantity
                        ? item.action.rawData.act.data.quantity.quantity
                        : item.action.rawData.act.data.quantity,
                      item.action.rawData.act.data.memo
                    ]
                    : item.action.rawData.act.data
              });
            }
            return false;
          });
          setDataList(reformList)
        }
      }).catch((error: any) => {
        setLoading(false)
      })
  }

  const stakeResource = new BigNumber(accountInfo?.net_weight / 10000).plus(accountInfo?.cpu_weight / 10000).toFixed(4, 1)

  const renderInfo = () => {
    return (
      <Card>
        <CardHeader className="flex flex-row content-center items-center justify-start space-y-0">
          <User className="mr-2 text-xl" />
          <CardTitle className="text-xl">
            Info
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Account Name
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accountInfo?.account_name || ''}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Created
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accountInfo?.created ? (dayjs(accountInfo?.created).format("MMM-DD-YYYY hh:mm:ss A")) : ''}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    )
  }

  const renderResource = () => {
    return (
      <Card className="mt-5">
        <CardHeader className="flex flex-row content-center items-center justify-start space-y-0">
          <PieChart className="mr-2 text-xl" />
          <CardTitle className="text-xl">
            Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Staked Resources ({isNaN(Number(stakeResource)) ? '--' : numberToThousands(stakeResource)} DMC)
              </CardTitle>
            </CardHeader>
            {/* <CardContent>
              <Progress
                className="h-2"
                value={0}
              />
            </CardContent> */}
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                RAM ({ramSizeFormat(Number(accountInfo?.ram_usage))} / {ramSizeFormat(Number(accountInfo?.ram_quota))})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress className="h-2" value={Number(new BigNumber(accountInfo?.ram_usage).div(accountInfo?.ram_quota).times(100).toFixed())} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                CPU ({cpuSizeFormat(Number(accountInfo?.cpu_limit?.used / 1000))} / {cpuSizeFormat(Number(accountInfo?.cpu_limit?.max / 1000))})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress className="h-2" value={Number(new BigNumber(accountInfo?.cpu_limit?.used).div(accountInfo?.cpu_limit?.max / 1000).times(100).toFixed())} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                NET ({netSizeFormat(Number(accountInfo?.net_limit?.used))} / {netSizeFormat(Number(accountInfo?.net_limit?.max))})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress className="h-2" value={Number(new BigNumber(accountInfo?.net_limit?.used).div(accountInfo?.net_limit?.max).times(100).toFixed())} />
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    )
  }

  const renderPermissions = () => {
    return (
      <Card className="mt-5">
        <CardHeader className="flex flex-row content-center items-center justify-start space-y-0">
          <BookOpenCheck className="mr-2 text-xl" />
          <CardTitle className="text-xl">Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table style={{ borderWidth: 1 }}>
            <TableHeader>
              <TableRow>
                <TableCell>Permission</TableCell>
                <TableCell>Authorization</TableCell>
                <TableCell>Key Weight</TableCell>
                <TableCell>Total Weight</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountInfo?.permissions?.map((e: any, index: number) => {
                return (
                  <TableRow key={`accounts${index.toString()} `}>
                    <TableCell>{e?.perm_name}</TableCell>
                    <TableCell className="pr-0">
                      {e?.required_auth?.accounts?.map((item: any, j: number) => {
                        return (
                          <div key={j.toString()} className={e?.required_auth?.accounts?.length > 1 ? 'mb-2 border-b' : ''}>
                            {item?.permission?.actor}@{item?.permission?.permission}
                          </div>
                        )
                      })}
                      {e?.required_auth?.keys?.map((item: any, j: number) => {
                        return (
                          <div key={j.toString()} className={e?.required_auth?.accounts?.length > 1 ? 'mb-2 border-b' : ''}>
                            {item?.key}
                          </div>
                        )
                      })}
                    </TableCell>
                    <TableCell style={{ paddingLeft: 0 }}>
                      {e?.required_auth?.accounts?.map((item: any, j: number) => {
                        return (
                          <div key={j.toString()} className={e?.required_auth?.accounts?.length > 1 ? 'mb-2  border-b pl-4' : 'pl-4'}>{item?.weight}</div>
                        )
                      })}
                      {e?.required_auth?.keys?.map((item: any, j: number) => {
                        return (
                          <div key={j.toString()} className={e?.required_auth?.accounts?.length > 1 ? 'mb-2  border-b pl-4' : 'pl-4'}>{item?.weight}</div>
                        )
                      })}
                    </TableCell>
                    <TableCell>{e?.required_auth?.threshold}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  const renderAssets = () => {
    return (
      <Card className="mt-5">
        <CardHeader className="flex flex-row content-center items-center justify-start space-y-0">
          <Wallet className="mr-2 text-xl" />
          <CardTitle className="text-xl">
            Assets
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assetsList.map((e, index) => {
            if (e?.balance?.quantity?.split(' ')[1] === 'DMC') {
              return (
                <Card key={`assets${index.toString()} `}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    DMC : {numberToThousands(new BigNumber(e?.balance?.quantity?.split(' ')[0]).plus(dmcLockedkAmount).plus(dmcStakedTotal).toFixed(4, 1))}
                  </CardHeader>
                  <CardContent>
                    {/* <div>Resource Staked Amount : {isNaN(Number(stakeResource)) ? '--' : stakeResource}</div> */}
                    <div>Available Amount : {numberToThousands(e?.balance?.quantity?.split(' ')[0])}</div>
                    <div>Staked Amount : {numberToThousands(new BigNumber(dmcStakedTotal).toFixed(4, 1))}</div>
                    <div>Locked Amount : {numberToThousands(new BigNumber(dmcLockedkAmount).toFixed(4, 1))}</div>
                  </CardContent>
                </Card>
              )
            }
            // <CardHeader className="flex flex-row items-center justify-between space-y-0">
            //         PST : {numberToThousands(new BigNumber(e?.balance?.quantity?.split(' ')[0]).plus(pstAmount).plus(pstLockedkAmount).toFixed(0))}
            //       </CardHeader>
            //       <CardContent>
            //         <div>Staked Amount : {numberToThousands(pstAmount)}</div>
            //         {/* <div>Available Amount : {e?.balance?.quantity?.split(' ')[0]}</div> */}
            //         <div>Locked Amount : {numberToThousands(new BigNumber(pstLockedkAmount).toFixed(0, 1))}</div>
            //       </CardContent>
            if (e?.balance?.quantity?.split(' ')[1] === 'PST') {
              return (
                <Card key={`assets${index.toString()} `}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    PST : {numberToThousands(pstTotal)}
                  </CardHeader>
                  <CardContent>
                    <div>PST in Pending : {numberToThousands(pstUnMatched)}</div>
                    {/* <div>Available Amount : {e?.balance?.quantity?.split(' ')[0]}</div> */}
                    <div>PST in Trading : {numberToThousands(pstUnderGoing)}</div>
                  </CardContent>
                </Card>
              )
            }
            return null
          })}
        </CardContent>
        {lockAssetsList.length > 0 && (
          <>
            <CardHeader className="flex flex-row content-center items-center justify-start">
              <CardTitle className="text-xl">
                Locked Detail
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lockAssetsList.map((e, index) => {
                return (
                  <Card className="" key={`lockassets${index.toString()}`}>
                    <CardHeader>
                      {e?.balance?.quantity?.split(' ')[1]} : {numberToThousands(e?.balance?.quantity?.split(' ')[0])}
                    </CardHeader>
                    <CardContent>
                      Unlock time : {dayjs(e?.lock_timestamp).format("MMM-DD-YYYY hh:mm:ss A")}
                    </CardContent>
                  </Card>
                )
              })}
            </CardContent>
          </>
        )}
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
                <Button
                  variant="link"
                  className="pl-0"
                  onClick={() => router.push(`/trx-info/${row.getValue("trx_id")}`)}
                >
                  <div style={{ maxWidth: 120 }} className="overflow-hidden truncate ">{row.getValue("trx_id")}</div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div>{row.getValue("trx_id")}</div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      }
    },
    {
      accessorKey: "block_num",
      header: "Block Num",
      cell: ({ row }: any) => {
        return (
          <Button
            variant="link"
            className="pl-0"
            onClick={() => router.push(`/block-info/${row.getValue("block_num")}`)}
          >
            {row.getValue("block_num")}
          </Button>
        )
      }
    },
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "time",
      header: "Time",
      cell: ({ row }: any) => {
        return (
          <Label className="whitespace-nowrap">
            {row.getValue("time")}
          </Label>
        )
      }
    },
    {
      accessorKey: "data",
      header: "Data",
      cell: ({ row }: any) => {
        if (row.getValue("data").length === 4) {
          if (row.getValue("data")[0] === account) {
            return (
              <p>
                <span className="text-red-500">{row.getValue("data")[0]}</span>{" "}
                {`-> `} <span>{row.getValue("data")[1]}</span>{", "}
                amount:
                <span className="text-red-500">{row.getValue("data")[2]}</span>{", "}
                memo:
                <span className="text-red-500">{row.getValue("data")[3]}</span>
              </p>
            );
          }
          if (row.getValue("data")[1] === account) {
            return (
              <p>
                <span>{row.getValue("data")[0]}</span> {`-> `}{" "}
                <span className="text-red-500">{row.getValue("data")[1]}</span>{", "}
                amount:
                <span className="text-red-500">{row.getValue("data")[2]}</span>{", "}
                memo:
                <span className="text-red-500">{row.getValue("data")[3]}</span>
              </p>
            );
          }
        } else {
          if (typeof row.getValue("data") === "string") {
            return <p>{JSON.stringify(row.getValue("data").substr(0, 12) + "...")}</p>;
          } else {
            return <p> {JSON.stringify(row.getValue("data"), null, 4)}</p>;
          }
        }
      }
    },
    {
      accessorKey: "actData",
      header: "Details",
      cell: ({ row }: any) => {
        return (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Details</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Details</DialogTitle>
                <DialogDescription>
                  <div>
                    <pre>
                      <code>{JSON.stringify(row.getValue("actData"), null, 4)}</code>
                    </pre>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogTrigger asChild>
                  <Button variant="secondary">Confirm</Button>
                </DialogTrigger>
              </DialogFooter>
            </DialogContent>
          </Dialog >
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
            pageCount={pageCount}
            loading={loading}
            columns={columns}
            data={dataList}
            clickIndexPage={(index) => {
              setPageIndex(index)
            }}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <section className="xs:w-screen sm:w-auto">
      {renderInfo()}
      {renderResource()}
      {renderPermissions()}
      {renderAssets()}
      {renderTrxList()}
    </section>
  )
}
