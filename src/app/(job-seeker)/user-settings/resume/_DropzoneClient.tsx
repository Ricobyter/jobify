"use client"

import { UploadDropzone } from "@/services/uploadthing/components/UploadThing"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { revalidateResumeCache } from "./actions"

export function DropzoneClient() {
  const router = useRouter()

  return (
    <UploadDropzone
      endpoint="resumeUploader"
      onClientUploadComplete={async (res) => {
        console.log("[DropzoneClient] onClientUploadComplete fired", res)
        await revalidateResumeCache()
        toast.success("Resume uploaded successfully")
        router.refresh()
      }}
      onUploadError={(error) => {
        console.error("[DropzoneClient] onUploadError fired", error)
        toast.error(`Upload failed: ${error.message}`)
      }}
    />
  )
}
