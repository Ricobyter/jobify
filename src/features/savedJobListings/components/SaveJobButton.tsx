"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { BookmarkIcon } from "lucide-react"
import { useOptimistic, useTransition } from "react"
import { toast } from "sonner"
import { toggleSavedJobListing } from "../actions/actions"

export function SaveJobButton({
  jobListingId,
  isSaved,
}: {
  jobListingId: string
  isSaved: boolean
}) {
  const [optimisticIsSaved, setOptimisticIsSaved] = useOptimistic(isSaved)
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={optimisticIsSaved ? "Remove from saved jobs" : "Save job"}
      aria-pressed={optimisticIsSaved}
      disabled={isPending}
      onClick={e => {
        e.preventDefault()
        e.stopPropagation()

        startTransition(async () => {
          setOptimisticIsSaved(!optimisticIsSaved)
          const res = await toggleSavedJobListing(jobListingId)

          if (res.error) {
            toast.error(res.message)
          }
        })
      }}
    >
      <BookmarkIcon
        className={cn(optimisticIsSaved && "fill-current")}
      />
    </Button>
  )
}
