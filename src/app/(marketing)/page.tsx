import Link from "next/link"
import Image from "next/image"
import heroImg from "@/assets/images/hero_img.png"
import candidateMatcherImg from "@/assets/images/candidate_matcher_img.png"
import jobifyLogo from "@/assets/images/jobify_logo.png"
import nextStepsImg from "@/assets/images/next_steps.png"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SignedIn, SignedOut } from "@/services/clerk/components/SignInStatus"
import { SignUpButton } from "@/services/clerk/components/AuthButtons"
import {
  CheckIcon,
  MessageSquareIcon,
  MicIcon,
  SearchIcon,
  StarIcon,
  FileTextIcon,
  LayoutDashboard,
  ArrowRightIcon,
} from "lucide-react"
import { FaGithub, FaLinkedin, FaXTwitter } from "react-icons/fa6"

const features = [
  {
    icon: SearchIcon,
    title: "AI-Powered Job Search",
    description:
      "Describe your goals in plain English and find roles that actually fit — no more endless filters.",
  },
  {
    icon: FileTextIcon,
    title: "Instant Resume Summaries",
    description:
      "Upload your resume and get a clean, structured AI summary that highlights your strengths.",
  },
  {
    icon: MicIcon,
    title: "AI Mock Interviews",
    description:
      "Practice with an adaptive AI interviewer tailored to your role and get actionable feedback.",
  },
  {
    icon: MessageSquareIcon,
    title: "Real-Time Messaging",
    description:
      "Chat directly with employers or applicants — no email back-and-forth.",
  },
  {
    icon: StarIcon,
    title: "AI Applicant Ranking",
    description:
      "Employers get automatically ranked applicants so the strongest fits rise to the top.",
  },
  {
    icon: LayoutDashboard,
    title: "Employer Dashboard",
    description:
      "Post, manage, and track listings with rich descriptions and full visibility into every applicant.",
  },
]

const steps = [
  {
    step: "1",
    title: "Create your profile",
    description:
      "Sign up and upload your resume — AI turns it into a polished summary in seconds.",
  },
  {
    step: "2",
    title: "Find the right role",
    description:
      "Search by keyword or describe what you want and let AI surface the best matches.",
  },
  {
    step: "3",
    title: "Apply, chat, and interview",
    description:
      "Message employers in real time and sharpen your pitch with an AI mock interview.",
  },
]

const trustedLogos = [
  "Google",
  "Microsoft",
  "airbnb",
  "amazon",
  "Meta",
  "Spotify",
]

const stats = [
  { value: "50K+", label: "Active job seekers" },
  { value: "1K+", label: "Hiring companies" },
  { value: "100K+", label: "Jobs matched" },
  { value: "4.8/5", label: "User satisfaction" },
]

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "For Employers", href: "#employers" },
    { label: "Pricing", href: "/employer/pricing" },
  ],
  Resources: [
    { label: "Blog", href: "#" },
    { label: "Career tips", href: "#" },
    { label: "Help center", href: "#" },
    { label: "Contact", href: "#" },
  ],
}

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
        <StatsSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  )
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60 dark:bg-[#0B0B0B]/80 dark:supports-backdrop-filter:bg-[#0B0B0B]/60 dark:border-[#242424]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Image
            src={jobifyLogo}
            alt="Jobify"
            sizes="32px"
            className="size-8 rounded-lg"
          />
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
          <Link href="/employer/pricing" className="transition-colors hover:text-foreground">
            Pricing
          </Link>
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
    <section className="relative overflow-hidden border-b dark:border-[#242424]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,var(--color-featured)/12%,transparent_55%)]"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
        <div>
          <Badge variant="secondary" className="mb-6 gap-1.5">
            <SearchIcon className="size-3.5 text-featured" />
            AI-powered job matching
          </Badge>

          <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            Find your next opportunity, faster.
          </h1>

          <p className="mt-6 max-w-md text-balance text-lg text-muted-foreground">
            Jobify helps you discover the right roles, prepare with AI tools,
            and connect directly with top employers — without the noise.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["No spam", "Relevant matches", "Free to use"].map(item => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckIcon className="size-3.5 text-foreground" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <HeroPreviewImage />
      </div>
    </section>
  )
}

function HeroPreviewImage() {
  return (
    <div className="relative">
      <Image
        src={heroImg}
        alt="Jobify product preview showing AI-matched job listings on desktop and mobile"
        priority
        sizes="(min-width: 768px) 50vw, 100vw"
        className="w-full rounded-xl"
      />
    </div>
  )
}

function LogoStrip() {
  return (
    <section className="border-b bg-muted/40 dark:border-[#242424] dark:bg-transparent">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Trusted by job seekers and employers
        </p>
        <div className="mt-6 grid grid-cols-2 items-center gap-6 text-muted-foreground sm:grid-cols-3 md:grid-cols-6">
          {trustedLogos.map(name => (
            <div
              key={name}
              className="flex items-center justify-center text-lg font-semibold tracking-tight opacity-70"
            >
              {name}
            </div>
          ))}
        </div>
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
          From discovery to offer, Jobify&apos;s AI tools work alongside you at every
          step of the process.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <Card
            key={title}
            className="border-border/60 dark:border-[#242424] dark:bg-[#131313]"
          >
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-muted text-foreground dark:bg-[#1f1f1f]">
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
    <section
      id="how-it-works"
      className="border-t bg-muted/40 dark:border-[#242424] dark:bg-transparent"
    >
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
          {steps.map(({ step, title, description }, i) => (
            <div key={step} className="relative flex flex-col items-start">
              <div className="flex w-full items-center">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                  {step}
                </span>
                {i < steps.length - 1 && (
                  <ArrowRightIcon className="mx-3 hidden size-4 shrink-0 text-muted-foreground/40 md:block" />
                )}
              </div>
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
            Post a job in minutes and get high-quality, AI-ranked applicants.
            Focus on the best candidates while we handle the rest.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <CheckIcon className="size-4 text-foreground" />
              Automatic 1–5 star applicant ranking
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="size-4 text-foreground" />
              Real-time chat with candidates
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="size-4 text-foreground" />
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

        <Image
          src={candidateMatcherImg}
          alt="Jobify employer dashboard showing AI-ranked candidates with match scores and applicant profiles"
          loading="lazy"
          sizes="(min-width: 768px) 50vw, 100vw"
          className="w-full"
        />
      </div>
    </section>
  )
}

function StatsSection() {
  return (
    <section className="border-t bg-foreground text-background dark:border-[#242424] dark:bg-[#0B0B0B] dark:text-foreground">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-14 text-center md:grid-cols-4">
        {stats.map(stat => (
          <div key={stat.label}>
            <p className="text-3xl font-semibold md:text-4xl">{stat.value}</p>
            <p className="mt-1 text-sm text-background/60 dark:text-muted-foreground">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function CtaSection() {
  return (
    <section className="border-t dark:border-[#242424] dark:bg-[#121212]">
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <div className="relative overflow-hidden dark:rounded-2xl dark:border dark:border-[#242424] dark:bg-[#131313] dark:px-8 dark:py-12">
          <Image
            src={nextStepsImg}
            alt=""
            aria-hidden
            fill
            sizes="(min-width: 768px) 900px, 100vw"
            className="hidden object-cover dark:block"
          />
          <div className="relative z-10">
            <Badge variant="secondary" className="mb-6">
              Your next opportunity is closer than you think
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Ready to find what&apos;s next?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Join Jobify today and let AI do the heavy lifting — from search
              to interview prep.
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
        </div>
      </div>
    </section>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t dark:border-[#242424]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Image
              src={jobifyLogo}
              alt="Jobify"
              sizes="24px"
              className="size-6 rounded-md"
            />
            Jobify
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Smarter job search. Brighter careers.
            <br />
            Built with AI.
          </p>
          <div className="mt-4 flex gap-4 text-muted-foreground">
            <Link href="#" aria-label="LinkedIn" className="transition-colors hover:text-foreground">
              <FaLinkedin className="size-4" />
            </Link>
            <Link href="#" aria-label="X (Twitter)" className="transition-colors hover:text-foreground">
              <FaXTwitter className="size-4" />
            </Link>
            <Link href="#" aria-label="GitHub" className="transition-colors hover:text-foreground">
              <FaGithub className="size-4" />
            </Link>
          </div>
        </div>

        {Object.entries(footerLinks).map(([heading, links]) => (
          <div key={heading}>
            <p className="text-sm font-medium">{heading}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {links.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <p className="text-sm font-medium">Stay updated</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Get the latest updates and career insights.
          </p>
          <form className="mt-3 flex gap-2">
            <Input type="email" placeholder="Enter your email" className="h-9" />
            <Button size="icon" type="submit" aria-label="Subscribe">
              <ArrowRightIcon className="size-4" />
            </Button>
          </form>
        </div>
      </div>

      <div className="border-t dark:border-[#242424]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Jobify. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="#" className="transition-colors hover:text-foreground">
              Terms
            </Link>
            <Link href="#" className="transition-colors hover:text-foreground">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
