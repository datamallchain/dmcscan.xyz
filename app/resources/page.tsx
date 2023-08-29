import Link from "next/link"

import { siteConfig } from "@/config/site"
import Resources from "@/components/resources"

export default function IndexPage() {
  return (
    <section className="grid items-center gap-6 pb-8 pt-6 sm:container md:py-10">
      <Resources />
    </section>
  )
}
