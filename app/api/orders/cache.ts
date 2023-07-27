// cache.js
// @ts-ignore
import cache from 'memory-cache'

// 定义缓存的过期时间（以毫秒为单位）
const CACHE_EXPIRATION_TIME = 24 * 60 * 60 * 10000; // 24h

// 创建一个新的缓存实例
const myCache = new cache.Cache();


// 获取缓存数据的函数
export const getCachedData = () => {
  if (myCache.get('orderData')) {
    return myCache.get('orderData');
  } else {
    return undefined
  }
};

// 设置缓存数据的函数
export const setCachedData = (data: any) => {
  myCache.put('orderData', data, CACHE_EXPIRATION_TIME);
};
