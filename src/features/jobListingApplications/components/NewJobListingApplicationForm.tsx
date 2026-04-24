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

type NewJobListingApplicationFormValues = {
  coverLetter: string
}

export function NewJobListingApplicationForm({
  jobListingId,
}: {
  jobListingId: string
}) {
  const form = useForm<NewJobListingApplicationFormValues>({
    resolver: zodResolver(newJobListingApplicationSchema as never),
    defaultValues: { coverLetter: "" },
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
