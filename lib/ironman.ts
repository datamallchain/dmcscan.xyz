'use client';
//@ts-ignore
import eosjs from 'eosjs'

export const loginIronman = (sucCb: { (data: any): void; (arg0: any, arg1: any, arg2: { accounts: { blockchain: any; chainId: any; host: string; port: any; protocol: any; }[]; }, arg3: any, arg4: { blockchain: any; chainId: any; host: string; port: any; protocol: any; }, arg5: any): void; }, noIronman: { (): void; (): void; }, config: { client: any; openAccount?: boolean; contractAccount?: string; }) => {
  if (!window.dmcironman) {
    if (!!noIronman) {
      noIronman()
    } else {

    }
  } else {
    const ironman = window.dmcironman
    const hostname = new URL(config.client.hostname).hostname
    const blockchain = config.client.blockchain

    //
    // window.dmcironman = null;
    // If you want to require a specific version of Scatter
    const dmcNetwork = {
      blockchain: blockchain,
      chainId: config.client.chainId,
      host: hostname,
      port: config.client.port,
      protocol: config.client.protocol,
    }

    const RequireDmcNetwork = {
      blockchain: blockchain,
      chainId: config.client.chainId,
    }
    ironman
      .getIdentity({
        accounts: [RequireDmcNetwork],
      })
      .then((identity: { accounts: any[]; }) => {
        const account = identity.accounts.find((acc: { blockchain: any; }) => acc.blockchain === blockchain)
        const { name, authority } = account
        const dmcOptions = {
          authorization: [`${name}@${authority}`],
          broadcast: true,
          chainId: config.client.chainId,
        }
        const dmc = ironman[blockchain](dmcNetwork, eosjs, dmcOptions, config.client.protocol)
        const requiredFields = {
          accounts: [dmcNetwork],
        }

        if (sucCb) {
          sucCb(ironman, dmc, requiredFields, account, dmcNetwork, identity)
        }
      })
      .catch((e: any) => {

      })
  }
}

export function logoutIronman(sucCb?: () => void) {
  const ironman = window.dmcironman
  if (sucCb) {
    sucCb()
  }
  if (ironman) {
    try {
      ironman
        .forgetIdentity()
        .then((value: any) => {
          sessionStorage.removeItem('account')
          if (window.location.pathname === '/resources' || window.location.pathname === '/tools') {
            setTimeout(() => {
              window.location.reload()
            }, 300);
          }
        })
        .catch((e: any) => {
          sessionStorage.removeItem('account')
          if (window.location.pathname === '/resources' || window.location.pathname === '/tools') {
            setTimeout(() => {
              window.location.reload()
            }, 300);
          }
        })
    } catch {
      sessionStorage.removeItem('account')
      if (window.location.pathname === '/resources' || window.location.pathname === '/tools') {
        setTimeout(() => {
          window.location.reload()
        }, 300);
      }
    }
  } else {
    sessionStorage.removeItem('account')
    if (window.location.pathname === '/resources' || window.location.pathname === '/tools') {
      setTimeout(() => {
        window.location.reload()
      }, 300);
    }
  }
}

export function loadIronman(sucCb: (arg0: any, arg1: any, arg2: { accounts: { blockchain: any; chainId: any; host: string; port: any; protocol: any; }[]; }, arg3: any, arg4: { blockchain: any; chainId: any; host: string; port: any; protocol: any; }, arg5: any) => void, config: { client: { hostname: string | URL; blockchain: any; chainId: any; port: any; protocol: any; }; }) {
  if (!window.dmcironman) {
  } else {
    const hostname = new URL(config.client.hostname).hostname
    const ironman = window.dmcironman
    const blockchain = config.client.blockchain
    const foNetwork = {
      blockchain: blockchain,
      chainId: config.client.chainId,
      host: hostname,
      port: config.client.port,
      protocol: config.client.protocol,
    }

    const RequireDmcNetwork = {
      blockchain: blockchain,
      chainId: config.client.chainId,
    }

    ironman
      .getIdentity({
        accounts: [RequireDmcNetwork],
      })
      .then((identity: { accounts: any[]; }) => {
        const account = identity.accounts.find((acc: { blockchain: any; }) => acc.blockchain === blockchain)
        const { name, authority } = account
        //
        const dmcOptions = {
          authorization: [`${name}@${authority}`],
          broadcast: true,
          chainId: config.client.chainId,
        }
        const dmc = ironman[blockchain](foNetwork, eosjs, dmcOptions, config.client.protocol)
        const requiredFields = {
          accounts: [foNetwork],
        }

        if (sucCb) {
          sucCb(ironman, dmc, requiredFields, account, foNetwork, identity)
        }
      })
      .catch((e: any) => {

      })
  }
}
