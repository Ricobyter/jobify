import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Suspense } from "react"
import { DropzoneClient } from "./_DropzoneClient"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentAuth"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer"
import { getUserResumes } from "@/features/users/db/userResumes"

export default function UserResumePage() {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6 px-4">
      <h1 className="text-2xl font-bold">Manage Your Resumes</h1>
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Upload a New Resume</CardTitle>
          <CardDescription>
            Upload multiple versions and give each one a clear title.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DropzoneClient />
        </CardContent>
      </Card>
      <Suspense>
        <ResumesList />
      </Suspense>
    </div>
  )
}

async function ResumesList() {
  const { userId } = await getCurrentUser()
  if (userId == null) return notFound()

  const resumes = await getUserResumes(userId)
  if (resumes.length === 0) return null

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Your Resumes</CardTitle>
        <CardDescription>
          These are the resumes you can choose from when applying or practicing interviews.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {resumes.map(resume => (
          <div
            key={resume.id}
            className="rounded-xl border bg-background p-4 space-y-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{resume.title}</h3>
                <p className="text-xs text-muted-foreground">
                  Uploaded {resume.createdAt.toLocaleDateString()}
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link
                  href={resume.resumeFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View File
                </Link>
              </Button>
            </div>
            {resume.aiSummary ? (
              <MarkdownRenderer source={resume.aiSummary} />
            ) : (
              <p className="text-sm text-muted-foreground">
                AI summary is still processing.
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
