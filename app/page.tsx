import Overview from "@/components/overview"
import Nodes from "@/components/nodes"
import PstList from "@/components/pst-list"

export default function IndexPage() {
  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <Overview />
      <div className="grid gap-4 lg:grid-cols-2">
        <Nodes isSummary={true} />
        <PstList isSummary={true} />
      </div>
    </section>
  )
}
