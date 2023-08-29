/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
  rewrites: async () => {
    return {
      fallback: [
        {
          source: '/v1/:path*',
          destination: 'https://explorer.dmctech.io/v1/:path*',
        },
        {
          source: '/2.1/:path*',
          destination: 'https://explorer.dmctech.io/2.1/:path*',
        },
        {
          source: '/innerUniswapTrade',
          destination: 'https://explorer.dmctech.io/innerUniswapTrade',
        },
        {
          source: '/checkAvgStakeRate',
          destination: 'https://explorer.dmctech.io/checkAvgStakeRate',
        },
        {
          source: '/obtainPSTHolding',
          destination: 'https://explorer.dmctech.io/obtainPSTHolding',
        },
        {
          source: '/data',
          destination: 'http://data.dmcscan.xyz/data',
        },
      ]
    }
  }
}

export default nextConfig
