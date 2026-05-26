import {
  Button,
  Container,
  Head,
  Heading,
  Html,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"
import tailwindConfig from "../data/tailwindConfig"

export default function InterestedNotificationEmail({
  applicantName,
  organizationName,
  jobListingTitle,
  conversationUrl,
}: {
  applicantName: string
  organizationName: string
  jobListingTitle: string
  conversationUrl: string
}) {
  return (
    <Tailwind config={tailwindConfig}>
      <Html>
        <Head />
        <Container className="font-sans">
          <Heading as="h1">Great news, {applicantName}!</Heading>
          <Text>
            <strong>{organizationName}</strong> has marked you as{" "}
            <strong>interested</strong> for the position of{" "}
            <strong>{jobListingTitle}</strong>.
          </Text>
          <Text>
            They&apos;ve opened a conversation to connect with you directly.
            Click the button below to view the conversation and respond.
          </Text>
          <Section>
            <Button
              href={conversationUrl}
              className="rounded-md text-sm font-medium bg-primary text-primary-foreground px-4 py-2"
            >
              Join Conversation
            </Button>
          </Section>
          <Text className="text-muted-foreground text-sm mt-8">
            If you did not apply for this job, please ignore this email.
          </Text>
        </Container>
      </Html>
    </Tailwind>
  )
}

InterestedNotificationEmail.PreviewProps = {
  applicantName: "Jane Smith",
  organizationName: "Acme Corp",
  jobListingTitle: "Senior Frontend Developer",
  conversationUrl: "http://localhost:3000/messages/some-conversation-id",
} satisfies Parameters<typeof InterestedNotificationEmail>[0]
