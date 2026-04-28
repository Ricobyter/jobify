"use client"

import { Input } from "@/components/ui/input"
import { UploadDropzone } from "@/services/uploadthing/components/UploadThing"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { revalidateResumeCache } from "./actions"

export function DropzoneClient() {
  const router = useRouter()
  const [title, setTitle] = useState("")

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-background p-4 space-y-3 shadow-sm">
        <div className="space-y-1">
          <label htmlFor="resume-title" className="text-sm font-medium">
            Resume Title
          </label>
          <p className="text-xs text-muted-foreground">
            Give each uploaded resume a distinct title so you can choose the right one later.
          </p>
        </div>
        <Input
          id="resume-title"
          value={title}
          onChange={event => setTitle(event.target.value)}
          placeholder="e.g. Senior Frontend Resume"
          autoComplete="off"
          className="bg-background"
        />
      </div>
      <UploadDropzone
        endpoint="resumeUploader"
        input={{ title }}
        className="w-full min-h-48"
        onClientUploadComplete={async (res) => {
          console.log("[DropzoneClient] onClientUploadComplete fired", res)
          setTitle("")
          await revalidateResumeCache()
          toast.success("Resume uploaded successfully")
          router.refresh()
        }}
        onUploadError={(error) => {
          console.error("[DropzoneClient] onUploadError fired", error)
          toast.error(`Upload failed: ${error.message}`)
        }}
      />
    </div>
  )
}
