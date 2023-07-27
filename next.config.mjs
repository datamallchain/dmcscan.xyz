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
          source: '/1.1/:path*',
          destination: 'https://explorer.dmctech.io/1.1/:path*',
        },
        {
          source: '/innerUniswapTrade',
          destination: 'https://explorer.dmctech.io/innerUniswapTrade',
        },
        {
          source: '/checkAvgStakeRate',
          destination: 'https://explorer.dmctech.io/checkAvgStakeRate',
        },
      ]
    }
  }
}

export default nextConfig
