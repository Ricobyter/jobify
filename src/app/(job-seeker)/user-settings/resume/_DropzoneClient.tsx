"use client"

import { UploadDropzone } from "@/services/uploadthing/components/UploadThing"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function DropzoneClient() {
  const router = useRouter()

  return (
    <UploadDropzone
      endpoint="resumeUploader"
      onClientUploadComplete={() => {
        toast.success("Resume uploaded successfully")
        router.refresh()
      }}
      onUploadError={(error) => {
        toast.error(`Upload failed: ${error.message}`)
      }}
    />
  )
}
