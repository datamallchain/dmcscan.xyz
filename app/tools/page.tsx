import Link from "next/link"

import { siteConfig } from "@/config/site"
import Tools from "@/components/tools"

export default function IndexPage() {
  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <Tools />
    </section>
  )
}
