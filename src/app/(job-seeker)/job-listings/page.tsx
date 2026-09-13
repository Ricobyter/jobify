import { Suspense } from "react"
import { JobListingItems } from "../_shared/JobListingItems"
import { JobSearchBar } from "../_shared/JobSearchBar"

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>
}) {
  return (
    <div className="m-4 space-y-6">
      <div className="space-y-4">
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Job Board
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Find your next opportunity
          </h1>
          <p className="text-muted-foreground mt-1">
            Explore top job openings from leading companies. Filter, search,
            and apply — all in one place.
          </p>
        </div>
        <Suspense>
          <JobSearchBar />
        </Suspense>
      </div>
      <JobListingItems searchParams={searchParams} />
    </div>
  )
}
