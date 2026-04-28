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
      <div className="space-y-2">
        <label className="text-sm font-medium">Resume Title</label>
        <Input
          value={title}
          onChange={event => setTitle(event.target.value)}
          placeholder="e.g. Senior Frontend Resume"
        />
        <p className="text-xs text-muted-foreground">
          Give each uploaded resume a distinct title so you can choose the right one later.
        </p>
      </div>
      <UploadDropzone
        endpoint="resumeUploader"
        input={{ title }}
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
