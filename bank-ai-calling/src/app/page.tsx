import { auth } from "@/auth";
import Link from "next/link";
import { LiveCallDemo } from "@/components/LiveCallDemo";
import { LandingHeader } from "@/components/LandingHeader";
import {
  UploadCloud,
  Sliders,
  PhoneCall,
  CheckCircle2,
  Radio,
  FileSpreadsheet,
  Globe,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default async function Home() {
  const session = await auth();
  const userName = session?.user?.name ?? null;
  const userInitial = userName ? userName.charAt(0).toUpperCase() : "?";

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-slate-900 selection:bg-[#004e9f]/10 selection:text-[#004e9f]">
      <LandingHeader
        isLoggedIn={Boolean(session?.user)}
        userName={userName}
        userInitial={userInitial}
        isAdmin={session?.user?.role === "ADMIN"}
        image={session?.user?.image}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white to-[#f9f9ff] px-6 py-20 sm:px-8 md:py-28">
        <div className="mx-auto max-w-7xl grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-[#004e9f] shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#004e9f] animate-pulse" />
              Enterprise Outbound Voice Automation
            </div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.15]">
              Every customer call,{" "}
              <span className="text-[#004e9f]">answered before you ask.</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-600 max-w-xl">
              Upload customer cohorts, configure compliance directives, and deploy bilingual AI voice agents that listen, respond with zero delay, and deliver structured verdicts directly to your team.
            </p>

            {!session?.user ? (
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#004e9f] px-6 py-3.5 text-sm font-semibold text-white shadow-sm shadow-[#004e9f]/25 hover:bg-[#003d7c] transition-all active:scale-[0.98]"
                >
                  Start Outbound Campaign
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
                >
                  Sign in to Portal
                </Link>
              </div>
            ) : (
              <div className="mt-8">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#004e9f] px-6 py-3.5 text-sm font-semibold text-white shadow-sm shadow-[#004e9f]/25 hover:bg-[#003d7c] transition-all"
                >
                  Open Operations Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>

          <div className="flex justify-center lg:justify-end">
            <LiveCallDemo />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="border-b border-slate-200/80 bg-white px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#004e9f]">
              Telephony Workflow
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              How a voice campaign executes
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-500">
              From contact list ingestion to structured downstream CRM settlement in four steps.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StepCard
              step="01"
              icon={UploadCloud}
              title="Upload Roster"
              description="Ingest CSV contact lists with names, numbers, and language preferences. Validated automatically for format anomalies."
            />
            <StepCard
              step="02"
              icon={Sliders}
              title="Configure Directive"
              description="Define regulatory boundaries, bank policies, and conversation logic once. The agent handles natural conversational variations."
            />
            <StepCard
              step="03"
              icon={PhoneCall}
              title="Autonomous Dialing"
              description="Agents place live calls via Twilio Media Streams and Gemini Live API, streaming low-latency natural human speech."
            />
            <StepCard
              step="04"
              icon={CheckCircle2}
              title="Structured Verdict"
              description="Every interaction concludes with sentiment categorization, interest classification, and instant Excel or CRM export."
            />
          </div>
        </div>
      </section>

      {/* Key Enterprise Features */}
      <section id="features" className="px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#004e9f]">
              Engineered For Banking
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Enterprise security and precision
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              Built to meet the compliance, throughput, and audit requirements of financial institutions.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Radio}
              title="Live Supervisor Stream"
              description="Supervisors can observe live turns in real-time as the conversation progresses, monitoring compliance without caller disruption."
            />
            <FeatureCard
              icon={FileSpreadsheet}
              title="Structured Verdicts"
              description="Eliminate hours of manual call playback. Automatically extract loan interest, proposed amounts, and callback schedules into clean reports."
            />
            <FeatureCard
              icon={Globe}
              title="Native Bilingual Calling"
              description="Seamlessly engage customers in English and Hindi, respecting localized linguistic cadence and financial terminology."
            />
          </div>
        </div>
      </section>

      {/* Bottom CTA for logged-out visitors */}
      {!session?.user && (
        <section className="bg-slate-900 py-16 px-6 sm:px-8 text-center text-white">
          <div className="mx-auto max-w-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#004e9f] text-white mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Ready to automate your banking outreach?
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Launch your first KYC or loan cohort in under five minutes.
            </p>
            <div className="mt-8">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-[#004e9f] px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#004e9f]/30 hover:bg-[#003d7c] transition-all"
              >
                Create Enterprise Account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-8 px-6 sm:px-8 text-center text-xs text-slate-500">
        <p>Bank AI Calling Platform · Secure Enterprise Voice Telephony</p>
      </footer>
    </div>
  );
}

function StepCard({
  step,
  icon: Icon,
  title,
  description,
}: {
  step: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#004e9f]">
          <Icon className="h-5 w-5" />
        </div>
        <span className="font-mono text-xs font-bold text-slate-400">{step}</span>
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:border-[#004e9f]/40 transition-all">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#004e9f] mb-4">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}