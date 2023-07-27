import { NextResponse } from 'next/server';
import { setCachedData, getCachedData } from './cache'

const fetchOrderTotalData = async () => {
  const body = `
  {
    count_order(
      order: "-created_time"
    )
  }
  `
  const response = await fetch('https://explorer.dmctech.io/1.1', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/graphql',
    },
    body,
    credentials: 'same-origin',
  })
  const data = await response.json();
  const count = data?.data?.count_order
  return count;
}

const fetchCacheOrderData = async (skip: number) => {
  const body = `
  {
    find_order(
      skip: ${skip}
      limit: 490
      order: "-created_time"
    ){
      miner_lock_dmc_amount
      miner_lock_pst_amount
      state
      lock_pledge_amount
      maker_snapshot {
        rate
     }
    }
  }
  `
  const response = await fetch('https://explorer.dmctech.io/1.1', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/graphql',
    },
    body,
    credentials: 'same-origin',
  })
  const data = await response.json();
  const totalData = data?.data?.find_order
  return totalData;
}

export async function GET() {
  try {
    let data = getCachedData(); // 从缓存中获取数据
    if (!data) {
      let totalCount = await fetchOrderTotalData();
      let totalData: any = []
      while (totalData.length < totalCount) {
        let lastData = await fetchCacheOrderData(totalData.length);
        totalData = totalData.concat(lastData)
      }
      setCachedData(totalData); // 将数据存入缓存
      return NextResponse.json({ data: totalData });
    }
    return NextResponse.json({ data: data });
  } catch (error) {
    return NextResponse.json({ error: JSON.stringify(error) });
  }
}
