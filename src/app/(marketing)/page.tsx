import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SignedIn, SignedOut } from "@/services/clerk/components/SignInStatus"
import { SignUpButton } from "@/services/clerk/components/AuthButtons"
import {
  BrainCircuitIcon,
  ClipboardListIcon,
  MessageSquareIcon,
  MicIcon,
  SparklesIcon,
  StarIcon,
  FileTextIcon,
  LayoutDashboard,
  ArrowRightIcon,
  BriefcaseIcon,
} from "lucide-react"

const features = [
  {
    icon: BrainCircuitIcon,
    title: "AI-Powered Job Search",
    description:
      "Describe your goals in plain English and let AI match you with the roles that actually fit — no more scrolling endless filters.",
  },
  {
    icon: FileTextIcon,
    title: "Instant Resume Summaries",
    description:
      "Upload your resume and get a clean, structured AI summary that helps employers see your strengths at a glance.",
  },
  {
    icon: MicIcon,
    title: "AI Mock Interviews",
    description:
      "Practice with an adaptive AI interviewer tailored to your resume and target role, then get a scored evaluation with a clear improvement plan.",
  },
  {
    icon: MessageSquareIcon,
    title: "Real-Time Messaging",
    description:
      "Chat directly with employers or applicants the moment there's a match — no email back-and-forth required.",
  },
  {
    icon: StarIcon,
    title: "AI Applicant Ranking",
    description:
      "Employers get every applicant automatically rated against the job so the strongest fits rise to the top.",
  },
  {
    icon: LayoutDashboard,
    title: "Employer Dashboard",
    description:
      "Post, edit, and manage listings with rich Markdown descriptions, plus full visibility into every applicant.",
  },
]

const steps = [
  {
    step: "01",
    title: "Create your profile",
    description: "Sign up and upload your resume — AI turns it into a polished summary in seconds.",
  },
  {
    step: "02",
    title: "Find the right role",
    description: "Search by keyword or describe what you want and let AI surface the best matches.",
  },
  {
    step: "03",
    title: "Apply, chat, and interview",
    description: "Message employers in real time and sharpen your pitch with an AI mock interview.",
  },
]

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <LogoStrip />
        <FeaturesSection />
        <HowItWorksSection />
        <EmployerSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  )
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BriefcaseIcon className="size-4" />
          </div>
          <span className="text-lg">Jobify</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-foreground">
            How it works
          </a>
          <a href="#employers" className="transition-colors hover:text-foreground">
            For Employers
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <SignedOut>
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <SignUpButton>
              <Button>Get Started</Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Button asChild>
              <Link href="/job-listings">Go to Job Board</Link>
            </Button>
          </SignedIn>
        </div>
      </div>
    </header>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,var(--color-featured)/12%,transparent_60%)]"
      />
      <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-24 text-center md:py-32">
        <Badge variant="secondary" className="mb-6 gap-1.5">
          <SparklesIcon className="size-3.5 text-featured" />
          AI-powered job matching
        </Badge>

        <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-6xl">
          Find your next role, faster —{" "}
          <span className="text-featured">with AI on your side</span>
        </h1>

        <p className="mt-6 max-w-2xl text-balance text-lg text-muted-foreground md:text-xl">
          Jobify matches job seekers to the right roles with AI search, sharpens
          your pitch with mock interviews, and helps employers find the best
          candidates automatically.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <SignedOut>
            <SignUpButton>
              <Button size="lg" className="gap-2">
                Get started for free
                <ArrowRightIcon className="size-4" />
              </Button>
            </SignUpButton>
            <Button size="lg" variant="outline" asChild>
              <Link href="/job-listings">Browse jobs</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button size="lg" className="gap-2" asChild>
              <Link href="/ai-search">
                Try AI Search
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/job-listings">Browse jobs</Link>
            </Button>
          </SignedIn>
        </div>
      </div>
    </section>
  )
}

function LogoStrip() {
  const items = [
    { icon: ClipboardListIcon, label: "Curated listings" },
    { icon: BrainCircuitIcon, label: "AI matching" },
    { icon: MicIcon, label: "Mock interviews" },
    { icon: MessageSquareIcon, label: "Real-time chat" },
    { icon: StarIcon, label: "AI ranking" },
  ]
  return (
    <section className="border-y bg-muted/40">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 text-muted-foreground sm:grid-cols-5">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center justify-center gap-2 text-sm">
            <Icon className="size-4" />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Everything you need to land the job
        </h2>
        <p className="mt-4 text-muted-foreground">
          From discovery to offer, Jobify's AI tools work alongside you at every
          step of the process.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="border-border/60">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-featured/10 text-featured">
                <Icon className="size-5" />
              </div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  )
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-t bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Three steps to your next opportunity
          </h2>
          <p className="mt-4 text-muted-foreground">
            No complicated setup — just a faster, smarter way to job search.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map(({ step, title, description }) => (
            <div key={step} className="relative">
              <span className="text-5xl font-semibold text-featured/30">
                {step}
              </span>
              <h3 className="mt-4 text-lg font-medium">{title}</h3>
              <p className="mt-2 text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function EmployerSection() {
  return (
    <section id="employers" className="mx-auto max-w-6xl px-4 py-24">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <Badge variant="secondary" className="mb-4">
            For Employers
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Hire faster with AI-ranked applicants
          </h2>
          <p className="mt-4 text-muted-foreground">
            Post a listing in minutes with rich Markdown descriptions. Every
            applicant is automatically rated against your job so you can focus
            on the strongest fits first, then message candidates directly the
            moment they apply.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <StarIcon className="size-4 text-featured" />
              Automatic 1–5 star applicant ranking
            </li>
            <li className="flex items-center gap-2">
              <MessageSquareIcon className="size-4 text-featured" />
              Real-time chat with applicants
            </li>
            <li className="flex items-center gap-2">
              <ClipboardListIcon className="size-4 text-featured" />
              Featured listings for extra visibility
            </li>
          </ul>
          <Button className="mt-8 gap-2" asChild>
            <Link href="/employer">
              Post a job
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        </div>

        <Card className="border-border/60">
          <CardContent className="space-y-4">
            {[
              { name: "Senior Frontend Engineer", rating: 5 },
              { name: "Product Designer", rating: 4 },
              { name: "Backend Engineer", rating: 4 },
            ].map((applicant) => (
              <div
                key={applicant.name}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="text-sm font-medium">{applicant.name}</p>
                  <p className="text-xs text-muted-foreground">AI-matched applicant</p>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon
                      key={i}
                      className={
                        i < applicant.rating
                          ? "size-4 fill-featured text-featured"
                          : "size-4 text-muted-foreground/30"
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function CtaSection() {
  return (
    <section className="border-t">
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Ready to find what's next?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Join Jobify today and let AI do the heavy lifting — from search to
          interview prep.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <SignedOut>
            <SignUpButton>
              <Button size="lg" className="gap-2">
                Get started for free
                <ArrowRightIcon className="size-4" />
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Button size="lg" className="gap-2" asChild>
              <Link href="/job-listings">
                Browse jobs
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
          </SignedIn>
        </div>
      </div>
    </section>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BriefcaseIcon className="size-3.5" />
          </div>
          Jobify
        </div>
        <p>&copy; {new Date().getFullYear()} Jobify. All rights reserved.</p>
      </div>
    </footer>
  )
}
