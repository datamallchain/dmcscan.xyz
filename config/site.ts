export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "DMC Explorer",
  description:
    "Explore the decentralized world of DMC with our block explorer. Discover the latest transactions recorded on the DMC blockchain, view wallet balances, and track the history of block confirmations. Get real-time insights into the network's health and performance",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Orders",
      href: "/orders",
    },
    {
      title: "Nodes",
      href: "/nodes",
    },
    {
      title: "Resources",
      href: "/resources",
    },
    {
      title: "Tools",
      href: "/tools",
    }
  ],
  links: {
    twitter: "https://twitter.com/shadcn",
    github: "https://github.com/datamallchain",
    docs: "https://ui.shadcn.com",
  },
}
