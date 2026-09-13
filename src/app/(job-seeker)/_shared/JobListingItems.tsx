import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { db } from "@/drizzle/db"
import {
  experienceLevels,
  JobListingTable,
  jobListingTypes,
  locationRequirements,
  OrganizationTable,
} from "@/drizzle/schema"
import { getOrganizationIdTag } from "@/features/organizations/db/cache/organizations"
import { getJobListingGlobalTag } from "@/features/jobListings/db/cache/jobListings"
import { JobListingBadges } from "@/features/jobListings/components/JobListingBadges"
import { getSavedJobListingIds } from "@/features/savedJobListings/db/savedJobListings"
import { SaveJobButton } from "@/features/savedJobListings/components/SaveJobButton"
import { convertSearchParamsToString } from "@/lib/convertSearchParamsToString"
import { cn } from "@/lib/utils"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentAuth"
import { differenceInDays } from "date-fns"
import { and, asc, desc, eq, ilike, or, SQL } from "drizzle-orm"
import { ArrowRightIcon, BuildingIcon, ExternalLinkIcon } from "lucide-react"
import Link from "next/link"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { connection } from "next/server"
import { Suspense } from "react"
import { z } from "zod"

type Props = {
  searchParams: Promise<Record<string, string | string[]>>
  params?: Promise<{ jobListingId: string }>
}

const searchParamsSchema = z.object({
  title: z.string().optional().catch(undefined),
  city: z.string().optional().catch(undefined),
  state: z.string().optional().catch(undefined),
  experience: z.enum(experienceLevels).optional().catch(undefined),
  locationRequirement: z.enum(locationRequirements).optional().catch(undefined),
  type: z.enum(jobListingTypes).optional().catch(undefined),
  sort: z.enum(["latest", "oldest"]).optional().catch("latest"),
  saved: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .catch(undefined),
  jobIds: z
    .union([z.string(), z.array(z.string())])
    .transform(v => (Array.isArray(v) ? v : [v]))
    .optional()
    .catch([]),
})

export function JobListingItems(props: Props) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SuspendedComponent {...props} />
    </Suspense>
  )
}

async function SuspendedComponent({ searchParams, params }: Props) {
  const jobListingId = params ? (await params).jobListingId : undefined
  const { success, data } = searchParamsSchema.safeParse(await searchParams)
  const search = success ? data : {}

  const { userId } = await getCurrentUser()
  const savedJobListingIds = userId ? await getSavedJobListingIds(userId) : null

  const savedOnly = search.saved === "true"
  if (savedOnly && userId == null) {
    return (
      <div className="text-muted-foreground p-4">
        Sign in to see your saved jobs.
      </div>
    )
  }

  const jobListings = await getJobListings(search, jobListingId)
  const visibleListings = savedOnly
    ? jobListings.filter(listing => savedJobListingIds?.has(listing.id))
    : jobListings

  if (visibleListings.length === 0) {
    return (
      <div className="text-muted-foreground p-4">
        {savedOnly ? "No saved jobs yet" : "No job listings found"}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        {visibleListings.length}{" "}
        {visibleListings.length === 1 ? "job" : "jobs"} found
      </p>
      <div className="space-y-3">
        {visibleListings.map(jobListing => (
          <JobListingListItem
            key={jobListing.id}
            jobListing={jobListing}
            organization={jobListing.organization}
            href={`/job-listings/${jobListing.id}?${convertSearchParamsToString(
              search
            )}`}
            isSaved={savedJobListingIds?.has(jobListing.id) ?? false}
          />
        ))}
      </div>
    </div>
  )
}

function stripMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function JobListingListItem({
  jobListing,
  organization,
  href,
  isSaved,
}: {
  jobListing: Pick<
    typeof JobListingTable.$inferSelect,
    | "id"
    | "title"
    | "description"
    | "stateAbbreviation"
    | "city"
    | "wage"
    | "wageInterval"
    | "experienceLevel"
    | "type"
    | "postedAt"
    | "locationRequirement"
    | "isFeatured"
  >
  organization: Pick<typeof OrganizationTable.$inferSelect, "name" | "imageUrl">
  href: string
  isSaved: boolean
}) {
  const excerpt = stripMarkdown(jobListing.description)

  return (
    <Link
      href={href}
      className={cn(
        "hover:border-foreground/20 block rounded-lg border p-4 transition-colors",
        jobListing.isFeatured && "border-featured bg-featured/10"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="bg-muted flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg">
          {organization.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={organization.imageUrl}
              alt={organization.name}
              className="size-full object-cover"
            />
          ) : (
            <BuildingIcon className="text-muted-foreground size-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold">
                {jobListing.title}
              </h3>
              <p className="text-muted-foreground flex items-center gap-1 text-sm">
                {organization.name}
                <ExternalLinkIcon className="size-3" />
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {jobListing.postedAt != null && (
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  <Suspense fallback={jobListing.postedAt.toLocaleDateString()}>
                    <DaysSincePosting postedAt={jobListing.postedAt} />
                  </Suspense>
                </span>
              )}
              <SaveJobButton jobListingId={jobListing.id} isSaved={isSaved} />
            </div>
          </div>

          {excerpt.length > 0 && (
            <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
              {excerpt}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <JobListingBadges
              jobListing={jobListing}
              className={jobListing.isFeatured ? "border-primary/35" : undefined}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <Button size="sm" variant="outline" tabIndex={-1} asChild>
          <span className="gap-1.5">
            View Details
            <ArrowRightIcon className="size-3.5" />
          </span>
        </Button>
      </div>
    </Link>
  )
}

async function DaysSincePosting({ postedAt }: { postedAt: Date }) {
  await connection()
  const daysSincePosted = differenceInDays(postedAt, Date.now())

  if (daysSincePosted === 0) {
    return <Badge>New</Badge>
  }

  return new Intl.RelativeTimeFormat(undefined, {
    style: "narrow",
    numeric: "always",
  }).format(daysSincePosted, "days")
}

async function getJobListings(
  searchParams: z.infer<typeof searchParamsSchema>,
  jobListingId: string | undefined
) {
  "use cache"
  cacheTag(getJobListingGlobalTag())

  const whereConditions: (SQL | undefined)[] = []
  if (searchParams.title) {
    whereConditions.push(
      ilike(JobListingTable.title, `%${searchParams.title}%`)
    )
  }

  if (searchParams.locationRequirement) {
    whereConditions.push(
      eq(JobListingTable.locationRequirement, searchParams.locationRequirement)
    )
  }

  if (searchParams.city) {
    whereConditions.push(ilike(JobListingTable.city, `%${searchParams.city}%`))
  }

  if (searchParams.state) {
    whereConditions.push(
      eq(JobListingTable.stateAbbreviation, searchParams.state)
    )
  }

  if (searchParams.experience) {
    whereConditions.push(
      eq(JobListingTable.experienceLevel, searchParams.experience)
    )
  }

  if (searchParams.type) {
    whereConditions.push(eq(JobListingTable.type, searchParams.type))
  }

  if (searchParams.jobIds) {
    whereConditions.push(
      or(...searchParams.jobIds.map(jobId => eq(JobListingTable.id, jobId)))
    )
  }

  const postedAtOrder =
    searchParams.sort === "oldest"
      ? asc(JobListingTable.postedAt)
      : desc(JobListingTable.postedAt)

  const data = await db.query.JobListingTable.findMany({
    where: or(
      jobListingId
        ? and(
            eq(JobListingTable.status, "published"),
            eq(JobListingTable.id, jobListingId)
          )
        : undefined,
      and(eq(JobListingTable.status, "published"), ...whereConditions)
    ),
    with: {
      organization: {
        columns: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },
    },
    orderBy: [desc(JobListingTable.isFeatured), postedAtOrder],
  })

  data.forEach(listing => {
    cacheTag(getOrganizationIdTag(listing.organization.id))
  })

  return data
}
