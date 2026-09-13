"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchIcon } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

const SEARCH_DEBOUNCE_MS = 250

export function JobSearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [title, setTitle] = useState(searchParams.get("title") ?? "")

  // Keep the input in sync if the title param changes from elsewhere
  // (e.g. the sidebar filter form, which writes to the same param).
  useEffect(() => {
    setTitle(searchParams.get("title") ?? "")
  }, [searchParams])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (title === (searchParams.get("title") ?? "")) return

      const newParams = new URLSearchParams(searchParams)
      if (title) {
        newParams.set("title", title)
      } else {
        newParams.delete("title")
      }
      router.push(`${pathname}?${newParams.toString()}`, { scroll: false })
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title])

  function updateSort(sort: string) {
    const newParams = new URLSearchParams(searchParams)
    if (sort === "latest") {
      newParams.delete("sort")
    } else {
      newParams.set("sort", sort)
    }
    router.push(`${pathname}?${newParams.toString()}`, { scroll: false })
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Search jobs, companies, or keywords..."
          className="pl-9"
        />
      </div>
      <Select
        defaultValue={searchParams.get("sort") ?? "latest"}
        onValueChange={updateSort}
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="latest">Latest first</SelectItem>
          <SelectItem value="oldest">Oldest first</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
