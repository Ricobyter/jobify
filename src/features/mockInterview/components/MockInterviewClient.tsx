"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoadingSwap } from "@/components/LoadingSwap"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  sendInterviewMessage,
  type ChatMessage,
  type EvaluationResult,
} from "../actions/mockInterviewActions"
import { toast } from "sonner"
import {
  BotIcon,
  UserIcon,
  SendIcon,
  StopCircleIcon,
  RotateCcwIcon,
  CheckCircleIcon,
  XCircleIcon,
  MinusCircleIcon,
  MicIcon,
  MicOffIcon,
  Volume2Icon,
} from "lucide-react"

type InterviewState = "setup" | "interviewing" | "evaluating" | "evaluated"

type SpeechRecognitionAlternativeLike = {
  transcript: string
}

type SpeechRecognitionResultLike = {
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternativeLike
}

type SpeechRecognitionEventLike = {
  resultIndex: number
  results: {
    length: number
    [index: number]: SpeechRecognitionResultLike
  }
}

type SpeechRecognitionErrorEventLike = {
  error?: string
}

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

export function MockInterviewClient({
  resumes,
}: {
  resumes: { id: string; title: string; resumeText: string }[]
}) {
  const [state, setState] = useState<InterviewState>("setup")
  const [jobRole, setJobRole] = useState("")
  const [mode, setMode] = useState<"text" | "voice">("text")
  const [selectedResumeId, setSelectedResumeId] = useState(
    resumes[0]?.id ?? ""
  )
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [questionCount, setQuestionCount] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const shouldKeepListeningRef = useRef(false)
  const autoSubmitAfterListeningRef = useRef(false)

  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false)
  const selectedResumeText =
    resumes.find(resume => resume.id === selectedResumeId)?.resumeText ?? ""

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatHistory, isLoading])

  useEffect(() => {
    if (typeof window === "undefined") return

    const SpeechRecognition =
      (window as Window & {
        SpeechRecognition?: SpeechRecognitionCtor
        webkitSpeechRecognition?: SpeechRecognitionCtor
      }).SpeechRecognition ??
      (window as Window & { webkitSpeechRecognition?: SpeechRecognitionCtor })
        .webkitSpeechRecognition

    setVoiceSupported(SpeechRecognition != null)
  }, [])

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    if (mode !== "voice") {
      stopListening()
      stopSpeaking()
      setInterimTranscript("")
    }
  }, [mode, stopListening])

  function stopSpeaking() {
    if (typeof window === "undefined") return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  const speakAssistant = useCallback((text: string) => {
    if (mode !== "voice" || typeof window === "undefined") return

    stopSpeaking()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.pitch = 1
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }, [mode])

  const stopListening = useCallback(() => {
    autoSubmitAfterListeningRef.current = true
    shouldKeepListeningRef.current = false
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  function startListening() {
    if (typeof window === "undefined") return
    if (!voiceSupported) {
      toast.error("Voice mode is not supported in this browser")
      return
    }

    const SpeechRecognition =
      (window as Window & {
        SpeechRecognition?: SpeechRecognitionCtor
        webkitSpeechRecognition?: SpeechRecognitionCtor
      }).SpeechRecognition ??
      (window as Window & { webkitSpeechRecognition?: SpeechRecognitionCtor })
        .webkitSpeechRecognition

    if (SpeechRecognition == null) {
      toast.error("Voice mode is not supported in this browser")
      return
    }

    if (recognitionRef.current == null) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "en-US"

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let finalTranscript = ""
        let interim = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const transcript = result[0].transcript

          if (result.isFinal) {
            finalTranscript += transcript
          } else {
            interim += transcript
          }
        }

        // Display interim results in real-time as user speaks
        if (interim.trim() !== "") {
          setInterimTranscript(interim.trim())
        }

        // Accumulate final results into the answer
        if (finalTranscript.trim() !== "") {
          setCurrentAnswer(prev => {
            const safePrev = prev.trim()
            if (safePrev === "") return finalTranscript.trim()
            return `${safePrev} ${finalTranscript.trim()}`.trim()
          })
          // Clear interim once finalized
          setInterimTranscript("")
        }
      }

      recognition.onerror = () => {
        setIsListening(false)
        shouldKeepListeningRef.current = false
        setInterimTranscript("")
        autoSubmitAfterListeningRef.current = false
        toast.error("Microphone input failed")
      }

      recognition.onend = () => {
        setInterimTranscript("")
        
        // If user stopped listening (not continuing), signal to auto-submit
        if (!shouldKeepListeningRef.current && autoSubmitAfterListeningRef.current) {
          autoSubmitAfterListeningRef.current = false
          setShouldAutoSubmit(true)
        } else if (shouldKeepListeningRef.current) {
          recognition.start()
        } else {
          setIsListening(false)
        }
      }

      recognitionRef.current = recognition
    }

    try {
      shouldKeepListeningRef.current = true
      recognitionRef.current.start()
      setIsListening(true)
    } catch {
      setIsListening(true)
    }
  }

  async function handleStartInterview() {
    if (!jobRole.trim()) {
      toast.error("Please enter a job role")
      return
    }
    setState("interviewing")
    setIsLoading(true)
    setQuestionCount(0)
    setChatHistory([])

    const result = await sendInterviewMessage({
      jobRole,
      mode,
      chatHistory: [],
      questionCount: 0,
      isComplete: false,
      resumeText: selectedResumeText,
    })

    setIsLoading(false)

    if (result.error) {
      toast.error(result.message)
      setState("setup")
      return
    }

    setChatHistory([{ role: "assistant", content: result.response }])
    setQuestionCount(1)
    speakAssistant(result.response)
  }

  const handleSendAnswer = useCallback(async () => {
    const answer = currentAnswer.trim()
    if (!answer || isLoading) return

    const updatedHistory: ChatMessage[] = [
      ...chatHistory,
      { role: "user", content: answer },
    ]
    setChatHistory(updatedHistory)
    setCurrentAnswer("")
    setInterimTranscript("")
    setIsLoading(true)

    const result = await sendInterviewMessage({
      jobRole,
      mode,
      chatHistory: updatedHistory,
      questionCount,
      isComplete: false,
      resumeText: selectedResumeText,
    })

    setIsLoading(false)

    if (result.error) {
      toast.error(result.message)
      return
    }

    setChatHistory(prev => [
      ...prev,
      { role: "assistant", content: result.response },
    ])
    setQuestionCount(prev => prev + 1)
    speakAssistant(result.response)
  }, [currentAnswer, isLoading, chatHistory, jobRole, mode, questionCount, speakAssistant])

  // Auto-submit when user stops listening and has an answer
  useEffect(() => {
    if (
      shouldAutoSubmit &&
      currentAnswer.trim() &&
      !isLoading &&
      mode === "voice"
    ) {
      setShouldAutoSubmit(false)
      void handleSendAnswer()
    }
  }, [shouldAutoSubmit, currentAnswer, isLoading, mode, handleSendAnswer])

  async function handleEndInterview() {
    setState("evaluating")
    setIsLoading(true)

    const result = await sendInterviewMessage({
      jobRole,
      mode,
      chatHistory,
      questionCount,
      isComplete: true,
      resumeText: selectedResumeText,
    })

    setIsLoading(false)

    if (result.error) {
      toast.error(result.message)
      setState("interviewing")
      return
    }

    try {
      const jsonText = result.response.replace(/```json\n?|\n?```/g, "").trim()
      const parsed = JSON.parse(jsonText) as EvaluationResult
      setEvaluation(parsed)
      setState("evaluated")
    } catch {
      toast.error("Failed to parse evaluation. Please try again.")
      setState("interviewing")
    }
  }

  function handleReset() {
    stopListening()
    stopSpeaking()
    setState("setup")
    setChatHistory([])
    setQuestionCount(0)
    setCurrentAnswer("")
    setInterimTranscript("")
    setShouldAutoSubmit(false)
    setEvaluation(null)
    setJobRole("")
  }

  if (state === "setup") {
    return <SetupForm
      jobRole={jobRole}
      setJobRole={setJobRole}
      mode={mode}
      setMode={setMode}
      resumes={resumes}
      selectedResumeId={selectedResumeId}
      setSelectedResumeId={setSelectedResumeId}
      onStart={handleStartInterview}
    />
  }

  if (state === "evaluated" && evaluation) {
    return <EvaluationView evaluation={evaluation} onReset={handleReset} />
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{jobRole}</Badge>
          <Badge variant="outline">{mode} mode</Badge>
          <Badge variant="outline">Q{questionCount}</Badge>
        </div>
        <Button
          variant="destructive"
          size="sm"
          disabled={isLoading || state === "evaluating" || questionCount < 3}
          onClick={handleEndInterview}
        >
          <StopCircleIcon className="size-4 mr-1" />
          {state === "evaluating" ? "Evaluating..." : "End Interview"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pb-4">
        {chatHistory.map((msg, i) => (
          <ChatBubble key={i} message={msg} />
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <BotIcon className="size-4 text-primary" />
            </div>
            <div className="bg-muted rounded-xl px-4 py-3 text-sm text-muted-foreground animate-pulse">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {state === "interviewing" && (
        <div className="flex gap-2 pt-4 border-t">
          <div className="flex-1 relative">
            <Input
              value={currentAnswer}
              onChange={e => setCurrentAnswer(e.target.value)}
              placeholder={mode === "voice" ? "Speak or type your answer..." : "Type your answer..."}
              disabled={isLoading}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendAnswer()
                }
              }}
            />
            {interimTranscript && (
              <div className="absolute inset-0 flex items-center px-3 pointer-events-none text-muted-foreground text-sm italic">
                <span className="line-clamp-1">
                  {currentAnswer}
                  <span className="font-light">{currentAnswer && " "}{interimTranscript}</span>
                </span>
              </div>
            )}
          </div>
          {mode === "voice" && (
            <Button
              variant={isListening ? "destructive" : "outline"}
              onClick={isListening ? stopListening : startListening}
              size="icon"
              disabled={isLoading || !voiceSupported}
              title={isListening ? "Stop listening" : "Start listening"}
            >
              {isListening ? (
                <MicOffIcon className="size-4" />
              ) : (
                <MicIcon className="size-4" />
              )}
            </Button>
          )}
          <Button
            onClick={handleSendAnswer}
            disabled={isLoading || !currentAnswer.trim()}
            size="icon"
          >
            <LoadingSwap isLoading={isLoading}>
              <SendIcon className="size-4" />
            </LoadingSwap>
          </Button>
        </div>
      )}

      {questionCount < 3 && state === "interviewing" && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Answer at least 3 questions before ending the interview
        </p>
      )}

      {mode === "voice" && state === "interviewing" && (
        <p className="text-xs text-muted-foreground text-center mt-1 flex items-center justify-center gap-1">
          <Volume2Icon className="size-3.5" />
          {isSpeaking
            ? "AI is speaking"
            : isListening
              ? "Listening to your answer"
              : voiceSupported
                ? "Use mic button to dictate answer"
                : "Voice mode not supported in this browser"}
        </p>
      )}
    </div>
  )
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === "assistant"
  return (
    <div className={`flex items-start gap-3 ${isAssistant ? "" : "flex-row-reverse"}`}>
      <div
        className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
          isAssistant ? "bg-primary/10" : "bg-secondary"
        }`}
      >
        {isAssistant ? (
          <BotIcon className="size-4 text-primary" />
        ) : (
          <UserIcon className="size-4" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
          isAssistant
            ? "bg-muted text-foreground"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}

function SetupForm({
  jobRole,
  setJobRole,
  mode,
  setMode,
  resumes,
  selectedResumeId,
  setSelectedResumeId,
  onStart,
}: {
  jobRole: string
  setJobRole: (v: string) => void
  mode: "voice" | "text"
  setMode: (v: "voice" | "text") => void
  resumes: { id: string; title: string; resumeText: string }[]
  selectedResumeId: string
  setSelectedResumeId: (v: string) => void
  onStart: () => void
}) {
  const [loading, setLoading] = useState(false)

  async function handleStart() {
    setLoading(true)
    await onStart()
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-lg w-full mx-auto">
      {resumes.length === 0 && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
          No resume uploaded. The interview will use general questions for the role. Upload your resume in{" "}
          <a href="/user-settings/resume" className="underline font-medium">
            User Settings
          </a>{" "}
          for a personalized experience.
        </div>
      )}

      {resumes.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Resume</label>
          <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
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
          <p className="text-xs text-muted-foreground">
            The interview questions will adapt to the selected resume.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Job Role</label>
        <Input
          value={jobRole}
          onChange={e => setJobRole(e.target.value)}
          placeholder="e.g. Senior Frontend Engineer, Data Scientist..."
          onKeyDown={e => e.key === "Enter" && handleStart()}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Interview Mode</label>
        <Select value={mode} onValueChange={v => setMode(v as "voice" | "text")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text — Professional, detailed questions</SelectItem>
            <SelectItem value="voice">Voice — Conversational, concise questions</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Voice mode uses shorter, conversational questions. Text mode uses professional phrasing.
        </p>
      </div>

      <Button
        className="w-full"
        onClick={handleStart}
        disabled={loading || !jobRole.trim()}
      >
        <LoadingSwap isLoading={loading}>Start Interview</LoadingSwap>
      </Button>
    </div>
  )
}

function EvaluationView({
  evaluation,
  onReset,
}: {
  evaluation: EvaluationResult
  onReset: () => void
}) {
  const ratingColor =
    evaluation.rating >= 7
      ? "text-green-600"
      : evaluation.rating >= 4
        ? "text-yellow-600"
        : "text-red-600"

  const hireIcon =
    evaluation.hire_recommendation === "yes" ? (
      <CheckCircleIcon className="size-5 text-green-600" />
    ) : evaluation.hire_recommendation === "no" ? (
      <XCircleIcon className="size-5 text-red-600" />
    ) : (
      <MinusCircleIcon className="size-5 text-yellow-600" />
    )

  return (
    <div className="space-y-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Interview Evaluation</h2>
        <Button variant="outline" size="sm" onClick={onReset}>
          <RotateCcwIcon className="size-4 mr-1" />
          New Interview
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Overall Rating</p>
            <p className={`text-4xl font-bold ${ratingColor}`}>
              {evaluation.rating}<span className="text-lg text-muted-foreground">/10</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Hire Recommendation</p>
            <div className="flex items-center gap-2 mt-1">
              {hireIcon}
              <span className="text-lg font-semibold capitalize">
                {evaluation.hire_recommendation}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{evaluation.summary}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-green-600">Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <CheckCircleIcon className="size-4 text-green-500 mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-red-600">Weaknesses</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {evaluation.weaknesses.map((w, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <XCircleIcon className="size-4 text-red-500 mt-0.5 shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Communication</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{evaluation.communication}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Improvement Plan</CardTitle>
          <CardDescription>Actionable steps to improve your performance</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {evaluation.improvement_plan.map((step, i) => (
              <li key={i} className="text-sm flex items-start gap-3">
                <span className="size-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
