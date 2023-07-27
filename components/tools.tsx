'use client';
import * as React from "react"
import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "./ui/checkbox";
import { chainConfig } from "@/config/chain";
import BigNumber from "bignumber.js"
import { loginIronman } from "@/lib/ironman";
import { reformChainError } from "@/lib/reformError";

interface StakeTypes {
  stakeAccount: string
  stakeReceive: string
  stakeCpu: string
  stakeNet: string
  stakeTransfer: number
}

interface UnstakeTypes {
  unstakeAccount: string
  unstakeReceive: string
  unstakeCpu: string
  unstakeNet: string
}

interface BuyramTypes {
  buyramAccount: string
  buyramReceive: string
  buyramAmount: string
  buyramUnit: string
}

interface SellramTypes {
  sellramAccount: string
  sellramAmount: string
  sellramUnit: string
}

interface CreateAccountTypes {
  creator: string,
  account: string
  owner: string,
  active: string,
  stakeCpu: string
  stakeNet: string
  buyRam: string
  stakeTransfer: number
}

export default function Tools() {
  const { toast } = useToast()
  const [account, setAccount] = useState('')
  const [resourceType, setResourceType] = useState('Stake Resource');
  const [stakeParams, setStakeParams] = useState<StakeTypes>({
    stakeAccount: '', stakeTransfer: 0, stakeCpu: '', stakeNet: '', stakeReceive: ''
  });
  const [unstakeParams, setUnstakeParams] = useState<UnstakeTypes>({
    unstakeAccount: '', unstakeCpu: '', unstakeNet: '', unstakeReceive: ''
  });

  const [buyramParams, setBuyramParams] = useState<BuyramTypes>({
    buyramAccount: '', buyramReceive: '', buyramAmount: '', buyramUnit: 'DMC'
  });
  const [sellramParams, setSellramParams] = useState<SellramTypes>({
    sellramAccount: '', sellramAmount: '', sellramUnit: 'bytes'
  });
  const [createAccountParams, setCreateAccountParams] = useState<CreateAccountTypes>({
    creator: '', account: '', owner: '', active: '', stakeCpu: '', stakeNet: '', buyRam: '', stakeTransfer: 0
  });

  useEffect(() => {
    if (sessionStorage.getItem('account')) {
      setAccount(sessionStorage.getItem('account') || '')
      setStakeParams({ ...stakeParams, stakeAccount: sessionStorage.getItem('account') || '' })
      setUnstakeParams({ ...unstakeParams, unstakeAccount: sessionStorage.getItem('account') || '' })
      setBuyramParams({ ...buyramParams, buyramAccount: sessionStorage.getItem('account') || '' })
      setSellramParams({ ...sellramParams, sellramAccount: sessionStorage.getItem('account') || '' })
      setCreateAccountParams({ ...createAccountParams, creator: sessionStorage.getItem('account') || '' })
    }
  }, [])

  const reformAmount = (amount: string) => {
    if (!amount) {
      return '0.0000 DMC'
    }
    return new BigNumber(amount).toFixed(4, 1) + ' DMC'
  }

  const transactionTrx = (actions: any) => {
    // @ts-ignore
    loginIronman((data, dmc) => {
      dmc.transaction(
        { actions }, {
        blocksBehind: 3,
        expireSeconds: 30,
      })
        .then((res: any) => {
          if (res?.transaction_id) {
            toast({
              variant: 'default',
              title: 'Succeed',
              description: 'The transaction is successful, transaction_id is ' + res?.transaction_id,
            })
          }
        })
        .catch((err: any) => {
          toast({
            variant: 'destructive',
            title: 'Operation failed',
            description: reformChainError(err),
          })
        });
    }, () => { },
      chainConfig)
  }

  const renderStake = () => {
    const transferFlagDisabled = !!stakeParams.stakeAccount && (stakeParams.stakeAccount === stakeParams.stakeReceive)
    return (
      <>
        <CardContent className="space-y-5">
          <div className="space-y-5">
            <Label htmlFor="stakeAccount">Account who stakes:</Label>
            <Input id="stakeAccount" defaultValue={stakeParams.stakeAccount} placeholder='Please login first' onChange={(e) => setStakeParams({ ...stakeParams, stakeAccount: e?.target?.value })} disabled />
          </div>
          <div className="space-y-5">
            <Label htmlFor="stakeReceive">Account who receives stake:</Label>
            <Input id="stakeReceive" placeholder="Please input receiver (Use 12 characters with a mix of letters from a-z, and numbers from 1-5)" onChange={(e) => setStakeParams({ ...stakeParams, stakeReceive: e?.target?.value })}
              maxLength={12}
            />
          </div>
          <div className="space-y-5">
            <Label htmlFor="stakeCpu">Amount of CPU to Stake (in DMC):</Label>
            <Input id="stakeCpu" placeholder="Please input the amount of CPU to stake" onChange={(e) => setStakeParams({ ...stakeParams, stakeCpu: e?.target?.value })} />
          </div>
          <div className="space-y-5">
            <Label htmlFor="stakeNet">Amount of NET to Stake (in DMC):</Label>
            <Input id="stakeNet" placeholder="Please input the amount of NET to stake" onChange={(e) => setStakeParams({ ...stakeParams, stakeNet: e?.target?.value })} />
          </div>
          <div className="mt-1"
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 20,
            }}
          >
            <Checkbox
              id="terms"
              checked={transferFlagDisabled ? false : stakeParams.stakeTransfer === 1}
              style={transferFlagDisabled ? { opacity: 0.5 } : { opacity: 1 }}
              disabled={transferFlagDisabled}
              onClick={(e) => setStakeParams({ ...stakeParams, stakeTransfer: stakeParams.stakeTransfer === 0 ? 1 : 0 })}
            />
            <label
              htmlFor="terms"
              className="ml-1 text-sm"
              style={transferFlagDisabled ? { opacity: 0.5 } : { opacity: 1 }}
            >
              Are you willing to transfer the corresponding token to the receiver
            </label>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => {
            if (!stakeParams
              || !stakeParams.stakeAccount
              || !stakeParams.stakeReceive
              || (!stakeParams.stakeNet && !stakeParams.stakeCpu)
            ) {
              toast({
                variant: 'destructive',
                title: "Please input all params",
              })
            } else {
              toast({
                variant: 'default',
                title: "Initiating transaction, please wait...",
              })
              const actions = [
                {
                  account: 'dmc',
                  name: 'delegatebw',
                  authorization: [{
                    actor: stakeParams.stakeAccount,
                    permission: 'active',
                  }],
                  data: {
                    from: stakeParams.stakeAccount,
                    receiver: stakeParams.stakeReceive,
                    stake_net_quantity: reformAmount(stakeParams.stakeNet),
                    stake_cpu_quantity: reformAmount(stakeParams.stakeCpu),
                    transfer: transferFlagDisabled ? 0 : stakeParams.stakeTransfer
                  },
                },
              ]
              transactionTrx(actions)
            }
          }}>Stake</Button>
        </CardFooter>
      </>
    )
  }

  const renderUnStake = () => {
    return (
      <>
        <CardContent className="space-y-5">
          <div className="space-y-5">
            <Label htmlFor="stakeAccount">Account who stakes:</Label>
            <Input id="stakeAccount" placeholder='Please login first' defaultValue={unstakeParams.unstakeAccount} onChange={(e) => setUnstakeParams({ ...unstakeParams, unstakeAccount: e?.target?.value })} disabled />
          </div>
          <div className="space-y-5">
            <Label htmlFor="stakeReceive">Account who receives stake:</Label>
            <Input id="stakeReceive" placeholder="Please input receiver (Use 12 characters with a mix of letters from a-z, and numbers from 1-5)" onChange={(e) => setUnstakeParams({ ...unstakeParams, unstakeReceive: e?.target?.value })}
              maxLength={12}
            />
          </div>
          <div className="space-y-5">
            <Label htmlFor="stakeCpu">Amount of CPU to Stake (in DMC):</Label>
            <Input id="stakeCpu" placeholder="Please input the amount of CPU to stake" onChange={(e) => setUnstakeParams({ ...unstakeParams, unstakeCpu: e?.target?.value })} />
          </div>
          <div className="space-y-5">
            <Label htmlFor="stakeNet">Amount of NET to Stake (in DMC):</Label>
            <Input id="stakeNet" placeholder="Please input the amount of NET to stake" onChange={(e) => setUnstakeParams({ ...unstakeParams, unstakeNet: e?.target?.value })} />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => {
            if (!unstakeParams
              || !unstakeParams.unstakeAccount
              || !unstakeParams.unstakeReceive

              || (!unstakeParams.unstakeNet && !unstakeParams.unstakeCpu)
            ) {
              toast({
                variant: 'destructive',
                title: "Please input all params",
              })
            } else {
              toast({
                variant: 'default',
                title: "Initiating transaction, please wait...",
              })
              const actions = [
                {
                  account: 'dmc',
                  name: 'undelegatebw',
                  authorization: [{
                    actor: unstakeParams.unstakeAccount,
                    permission: 'active',
                  }],
                  data: {
                    from: unstakeParams.unstakeAccount,
                    receiver: unstakeParams.unstakeReceive,
                    unstake_net_quantity: reformAmount(unstakeParams.unstakeNet),
                    unstake_cpu_quantity: reformAmount(unstakeParams.unstakeCpu),
                  },
                },
              ]
              transactionTrx(actions)
            }
          }}>Unstake</Button>
        </CardFooter>
      </>
    )
  }

  const renderbuyRam = () => {
    return (
      <>
        <CardContent className="space-y-5">
          <div className="space-y-5">
            <Label htmlFor="stakeAccount">Buyer (Account who buys RAM):</Label>
            <Input id="stakeAccount" placeholder='Please login first' defaultValue={buyramParams.buyramAccount} onChange={(e) => setBuyramParams({ ...buyramParams, buyramAccount: e?.target?.value })} disabled />
          </div>
          <div className="space-y-5">
            <Label htmlFor="stakeReceive">Receiver(Account who receives RAM):</Label>
            <Input id="stakeReceive" placeholder="Please input receiver (Use 12 characters with a mix of letters from a-z, and numbers from 1-5)" onChange={(e) => setBuyramParams({ ...buyramParams, buyramReceive: e?.target?.value })}
              maxLength={12}
            />
          </div>
          <div className="space-y-5">
            <Label htmlFor="stakeCpu">Amount:</Label>
            <div className="flex flex-row">
              <Input id="stakeCpu" placeholder="Please input the amount" onChange={(e) => setBuyramParams({ ...buyramParams, buyramAmount: e?.target?.value })} />
              <RadioGroup
                onClick={(e: any) => {
                  if (e?.target?.value && e?.target?.value !== buyramParams.buyramUnit) {
                    setBuyramParams({ ...buyramParams, buyramUnit: e?.target?.value })
                  }
                }}
                defaultValue="DMC" className="ml-5 flex space-x-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="DMC" id="ramr1" />
                  <Label htmlFor="ramr1">DMC</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bytes" id="ramr2" />
                  <Label htmlFor="ramr2">bytes</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent >
        <CardFooter>
          <Button onClick={() => {
            if (!buyramParams
              || !buyramParams.buyramAccount
              || !buyramParams.buyramReceive
              || !buyramParams.buyramAmount
            ) {
              toast({
                variant: 'destructive',
                title: "Please input all params",
              })
            } else {
              toast({
                variant: 'default',
                title: "Initiating transaction, please wait...",
              })
              let actions = []
              if (buyramParams.buyramUnit === 'DMC') {
                actions.push({
                  account: 'dmc',
                  name: 'buyram',
                  authorization: [{
                    actor: buyramParams.buyramAccount,
                    permission: 'active',
                  }],
                  data: {
                    payer: buyramParams.buyramAccount,
                    receiver: buyramParams.buyramReceive,
                    quant: reformAmount(buyramParams.buyramAmount),
                  },
                })
              } else {
                actions.push({
                  account: 'dmc',
                  name: 'buyrambytes',
                  authorization: [{
                    actor: buyramParams.buyramAccount,
                    permission: 'active',
                  }],
                  data: {
                    payer: buyramParams.buyramAccount,
                    receiver: buyramParams.buyramReceive,
                    bytes: Number(buyramParams.buyramAmount),
                  },
                },)
              }
              transactionTrx(actions)
            }
          }}>Buy RAM</Button>
        </CardFooter>
      </>
    )
  }

  const rendersellRam = () => {
    return (
      <>
        <CardContent className="space-y-5">
          <div className="space-y-5">
            <Label htmlFor="stakeAccount">Seller (Account who sells RAM):</Label>
            <Input id="stakeAccount" placeholder='Please login first' defaultValue={sellramParams.sellramAccount} onChange={(e) => setSellramParams({ ...sellramParams, sellramAccount: e?.target?.value })} disabled />
          </div>
          <div className="space-y-5">
            <Label htmlFor="stakeCpu">Amount:</Label>
            <div className="flex flex-row">
              <Input id="stakeCpu" placeholder="Please input the amount" onChange={(e) => setSellramParams({ ...sellramParams, sellramAmount: e?.target?.value })} />
              <RadioGroup
                onClick={(e: any) => {
                  if (e?.target?.value && e?.target?.value !== sellramParams.sellramUnit) {
                    setSellramParams({ ...sellramParams, sellramUnit: e?.target?.value })
                  }
                }}
                defaultValue="bytes" className="ml-5 flex space-x-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bytes" id="sellramr1" />
                  <Label htmlFor="sellramr1">bytes</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent >
        <CardFooter>
          <Button onClick={() => {
            if (!sellramParams
              || !sellramParams.sellramAccount
              || !sellramParams.sellramAmount
              || !new BigNumber(sellramParams.sellramAmount).isInteger()
            ) {
              toast({
                variant: 'destructive',
                title: "Please input all params",
              })
            } else {
              toast({
                variant: 'default',
                title: "Initiating transaction, please wait...",
              })
              const actions = [
                {
                  account: 'dmc',
                  name: 'sellram',
                  authorization: [{
                    actor: sellramParams.sellramAccount,
                    permission: 'active',
                  }],
                  data: {
                    account: sellramParams.sellramAccount,
                    bytes: new BigNumber(sellramParams.sellramAmount).toFixed(0),
                  },
                },
              ]
              transactionTrx(actions)
            }
          }}>Sell RAM</Button>
        </CardFooter>
      </>
    )
  }

  const renderManagerResources = () => {
    return (
      <Card>
        <CardHeader>
          <RadioGroup
            onClick={(e: any) => {
              if (e?.target?.value && e?.target?.value !== resourceType) {
                setResourceType(e?.target?.value)
              }
            }}
            defaultValue="Stake Resource" className="flex grid-cols-4 space-x-10">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Stake Resource" id="r1" />
              <Label htmlFor="r1">Stake Resource</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Unstake Resource" id="r2" />
              <Label htmlFor="r2">Unstake Resource</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Buy RAM" id="r3" />
              <Label htmlFor="r3">Buy RAM</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Sell RAM" id="r4" />
              <Label htmlFor="r4">Sell RAM</Label>
            </div>
          </RadioGroup>
        </CardHeader>
        {resourceType === 'Stake Resource' && renderStake()}
        {resourceType === 'Unstake Resource' && renderUnStake()}
        {resourceType === 'Buy RAM' && renderbuyRam()}
        {resourceType === 'Sell RAM' && rendersellRam()}
      </Card >
    )
  }

  const renderCreateAccount = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Public key and private key can be generated by DMC Wallet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-5">
            <Label htmlFor="stakeAccount">Creator:</Label>
            <Input id="stakeAccount" defaultValue={createAccountParams.creator} placeholder='Please login first' onChange={(e) => setCreateAccountParams({ ...createAccountParams, creator: e?.target?.value })} disabled />
          </div>
          <div className="space-y-5">
            <Label htmlFor="stakeReceive">New Account:</Label>
            <Input id="stakeReceive" placeholder="Please input new account (Use 12 characters with a mix of letters from a-z, and numbers from 1-5)" onChange={(e) => setCreateAccountParams({ ...createAccountParams, account: e?.target?.value })}
              maxLength={12}
            />
          </div>
          <div className="space-y-5">
            <Label htmlFor="stakeReceive">Owner Public Key:</Label>
            <Input id="stakeReceive" placeholder="Start with 'DM'" onChange={(e) => setCreateAccountParams({ ...createAccountParams, owner: e?.target?.value })}
            />
          </div>
          <div className="space-y-5">
            <Label htmlFor="stakeReceive">Active Public Key:</Label>
            <Input id="stakeReceive" placeholder="Start with 'DM'" onChange={(e) => setCreateAccountParams({ ...createAccountParams, active: e?.target?.value })}
            />
          </div>
          <div className="space-y-5">
            <Label htmlFor="createStakeCpu">Amount of CPU to Stake (in DMC):</Label>
            <Input id="createStakeCpu" placeholder="Please input the amount of CPU to stake" onChange={(e) => setCreateAccountParams({ ...createAccountParams, stakeCpu: e?.target?.value })} />
          </div>
          <div className="space-y-5">
            <Label htmlFor="createStakeNet">Amount of NET to Stake (in DMC):</Label>
            <Input id="createStakeNet" placeholder="Please input the amount of NET to stake" onChange={(e) => setCreateAccountParams({ ...createAccountParams, stakeNet: e?.target?.value })} />
          </div>
          <div className="space-y-5">
            <Label htmlFor="createBuyRam">RAM to Buy (in Bytes):</Label>
            <Input id="createBuyRam" placeholder="Please input the amount of RAM to buy" onChange={(e) => setCreateAccountParams({ ...createAccountParams, buyRam: e?.target?.value })} />
          </div>
          <div className="mt-1"
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 20,
            }}
          >
            <Checkbox
              id="terms"
              onClick={(e) => setCreateAccountParams({ ...createAccountParams, stakeTransfer: createAccountParams.stakeTransfer === 0 ? 1 : 0 })}
            />
            <label
              htmlFor="terms"
              className="ml-1 text-sm"
            >
              Please confirm to send the stake
            </label>
          </div>
          <label
            htmlFor="terms"
            className="ml-1 text-sm"
          >
            * If you check, the amount of stake will be sent to the receiver. If not, the amount of stake will be reserved
          </label>
        </CardContent>
        <CardFooter>
          <Button onClick={() => {
            if (!createAccountParams
              || !createAccountParams.creator
              || !createAccountParams.account
              || !createAccountParams.owner
              || !createAccountParams.active
              || !createAccountParams.stakeCpu
              || !createAccountParams.stakeNet
              || !createAccountParams.buyRam
            ) {
              toast({
                variant: 'destructive',
                title: "Please input all params",
              })
            } else {
              toast({
                variant: 'default',
                title: "Initiating transaction, please wait...",
              })
              const actions = [
                {
                  account: 'dmc',
                  name: 'newaccount',
                  authorization: [{
                    actor: createAccountParams.creator,
                    permission: 'active',
                  }],
                  data: {
                    creator: createAccountParams.creator,
                    name: createAccountParams.account,
                    owner: createAccountParams.owner,
                    active: createAccountParams.active
                  }
                },
                {
                  account: 'dmc',
                  name: 'buyrambytes',
                  authorization: [{
                    actor: createAccountParams.creator,
                    permission: 'active',
                  }],
                  data: {
                    payer: createAccountParams.creator,
                    receiver: createAccountParams.account,
                    bytes: Number(createAccountParams.buyRam),
                  },
                },
                {
                  account: 'dmc',
                  name: 'delegatebw',
                  authorization: [{
                    actor: createAccountParams.creator,
                    permission: 'active',
                  }],
                  data: {
                    from: createAccountParams.creator,
                    receiver: createAccountParams.account,
                    stake_net_quantity: reformAmount(createAccountParams.stakeNet),
                    stake_cpu_quantity: reformAmount(createAccountParams.stakeCpu),
                    transfer: createAccountParams.stakeTransfer === 1 ? 1 : 0
                  },
                }
              ]
              transactionTrx(actions)
            }
          }}>Create New Account</Button>
        </CardFooter>
      </Card >
    )
  }

  return (
    <Tabs defaultValue="resources" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="resources">Manage Resources</TabsTrigger>
        <TabsTrigger value="account">Create New Account</TabsTrigger>
      </TabsList>
      <TabsContent value="resources">
        {renderManagerResources()}
      </TabsContent>
      <TabsContent value="account">
        {renderCreateAccount()}
      </TabsContent>
    </Tabs>
  )
}
