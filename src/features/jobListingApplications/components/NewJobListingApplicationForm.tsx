"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { MarkdownEditor } from "@/components/markdown/MarkdownEditor"
import { LoadingSwap } from "@/components/LoadingSwap"
import { toast } from "sonner"
import { createJobListingApplication } from "../actions/actions"
import { newJobListingApplicationSchema } from "../actions/schemas"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserResumeTable } from "@/drizzle/schema"

type NewJobListingApplicationFormValues = {
  resumeId: string
  coverLetter: string
}

export function NewJobListingApplicationForm({
  jobListingId,
  resumes,
}: {
  jobListingId: string
  resumes: Pick<typeof UserResumeTable.$inferSelect, "id" | "title">[]
}) {
  const form = useForm<NewJobListingApplicationFormValues>({
    resolver: zodResolver(newJobListingApplicationSchema as never),
    defaultValues: { resumeId: resumes[0]?.id ?? "", coverLetter: "" },
  })

  async function onSubmit(data: NewJobListingApplicationFormValues) {
    const results = await createJobListingApplication(jobListingId, data)

    if (results.error) {
      toast.error(results.message)
      return
    }

    toast.success(results.message)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          name="resumeId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resume</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a resume" />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map(resume => (
                      <SelectItem key={resume.id} value={resume.id}>
                        {resume.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                Pick the resume version you want to submit with this application.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="coverLetter"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Letter</FormLabel>
              <FormControl>
                <MarkdownEditor {...field} markdown={field.value ?? ""} />
              </FormControl>
              <FormDescription>Optional</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          disabled={form.formState.isSubmitting}
          type="submit"
          className="w-full"
        >
          <LoadingSwap isLoading={form.formState.isSubmitting}>
            Apply
          </LoadingSwap>
        </Button>
      </form>
    </Form>
  )
}
