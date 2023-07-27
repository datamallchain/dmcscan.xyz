export type ChainConfig = typeof chainConfig

export const chainConfig = {
  // dis
  client: {
    chainId: '4d1fb981dd562d2827447dafa89645622bdcd4e29185d60eeb45539f25d2d85d',
    hostname: "https://explorer.dmctech.io",
    port: 443,
    protocol: 'https',
    blockchain: 'dmc',
    searchApi: "/1.1"
  },

  // rc1
  // client: {
  //     chainId: '4d1fb981dd562d2827447dafa89645622bdcd4e29185d60eeb45539f25d2d85d',
  //     hostname: 'http://test.dmctech.io',
  //     port: 80,
  //     protocol: 'http',
  //     blockchain: 'dmc',
  //     searchApi: "/1.1"
  // },

  // test
  // client: {
  //     chainId: '846dadc224819b7aeca099d55b9f83465eb0a71a5b0bfe30ae8f1ebb39213618',
  //     hostname: 'http://154.31.40.10:8870',
  //     port: 8870,
  //     protocol: 'http',
  //     blockchain: 'dmc',
  //     searchApi: "/1.1"
  // },

  openAccount: false,
  contractAccount: "datamall",
}
