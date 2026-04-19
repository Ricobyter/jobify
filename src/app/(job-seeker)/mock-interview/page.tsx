import { AsyncIf } from "@/components/AsyncIf"
import { LoadingSwap } from "@/components/LoadingSwap"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { MockInterviewClient } from "@/features/mockInterview/components/MockInterviewClient"
import {
  getUserResumeText,
} from "@/features/mockInterview/actions/mockInterviewActions"
import { SignUpButton } from "@/services/clerk/components/AuthButtons"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentAuth"

export default function MockInterviewPage() {
  return (
    <div className="p-4 flex items-center justify-center min-h-full">
      <Card className="w-full max-w-4xl">
        <AsyncIf
          condition={async () => {
            const { userId } = await getCurrentUser()
            return userId != null
          }}
          loadingFallback={
            <LoadingSwap isLoading>
              <InterviewShell resumeText="" />
            </LoadingSwap>
          }
          otherwise={<NoPermission />}
        >
          <InterviewShellAsync />
        </AsyncIf>
      </Card>
    </div>
  )
}

async function InterviewShellAsync() {
  const resumeText = await getUserResumeText()
  return <InterviewShell resumeText={resumeText ?? ""} />
}

function InterviewShell({ resumeText }: { resumeText: string }) {
  return (
    <>
      <CardHeader>
        <CardTitle>Mock Interview</CardTitle>
        <CardDescription>
          Practice with an AI interviewer that adapts to your resume and gives
          honest feedback.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[420px] flex flex-col">
        <MockInterviewClient resumeText={resumeText} />
      </CardContent>
    </>
  )
}

function NoPermission() {
  return (
    <CardContent className="text-center py-12">
      <h2 className="text-xl font-bold mb-1">Permission Denied</h2>
      <p className="mb-4 text-muted-foreground">
        You need to create an account before using Mock Interviews
      </p>
      <SignUpButton />
    </CardContent>
  )
}
