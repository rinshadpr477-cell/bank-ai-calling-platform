import { auth } from "@/auth";
import { LiveCallDemo } from "@/components/LiveCallDemo";
import { LandingHeader } from "@/components/LandingHeader";

export default async function Home() {
    const session = await auth();
    const userName = session?.user?.name ?? null;
    const userInitial = userName ? userName.charAt(0).toUpperCase() : "?";

    return (
        <div className="min-h-screen bg-[#E9E0CF]">
            <LandingHeader isLoggedIn={Boolean(session?.user)} userName={userName} userInitial={userInitial} isAdmin={session?.user?.role === "ADMIN"} image={session?.user?.image} />

            <section className="grid w-full items-center gap-10 px-8 py-20 md:grid-cols-2 md:py-28">
                <div>
                    <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[#5E775E]">
                        Outbound calling, run by AI
                    </p>
                    <h1 className="mt-4 font-[family-name:var(--font-fraunces)] text-4xl leading-tight text-[#132B23] md:text-5xl">
                        Every customer call,
                        <br />
                        answered before you ask.
                    </h1>
                    <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#132B23]/70">
                        Upload a customer list, write the brief, and let an AI agent call
                        each one, live, in their language, then hand your team a
                        clear verdict on every call: interested or not, and why.
                    </p>
                    {!session?.user && (
                        <div className="mt-8 flex items-center gap-4">
                            <a href="/register" className="rounded-md bg-[#132B23] px-6 py-3 text-sm font-medium text-[#E9E0CF] hover:bg-[#5E775E]">
                                Get started
                            </a>
                            <a href="/login" className="text-sm font-medium text-[#132B23] underline underline-offset-4">
                                Sign in
                            </a>
                        </div>
                    )}
                </div>

                <div className="flex justify-center md:justify-end">
                    <LiveCallDemo />
                </div>
            </section>

            <section id="how-it-works" className="border-t border-[#BA9B5F]/30 bg-[#F5F0E6]">
                <div className="w-full px-8 py-20">
                    <h2 className="font-[family-name:var(--font-fraunces)] text-2xl text-[#132B23]">
                        How a campaign runs
                    </h2>
                    <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
                        <Step n="01" title="Upload" body="A CSV of names, numbers, and language, validated for duplicates and bad numbers on the way in." />
                        <Step n="02" title="Configure" body="Write the brief once: who you are, what you're offering, how the call should go." />
                        <Step n="03" title="Call" body="The agent dials, speaks naturally, listens for real objections, and adapts mid-call." />
                        <Step n="04" title="Review" body="Every call ends in a verdict: interested, sentiment, amount, callback, ready for your team." />
                    </div>
                </div>
            </section>

            <section id="features" className="w-full px-8 py-20">
                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
                    <Feature title="Watch calls live" body="Supervisors can follow the conversation turn by turn while it's still happening, without interrupting either side." />
                    <Feature title="A verdict, not a recording" body="Every call ends with a structured outcome your team can act on immediately, no listening back required." />
                    <Feature title="Speaks their language" body="Campaigns run in the customer's own language, set per contact at upload." />
                </div>
            </section>

            {!session?.user && (
                <section className="border-t border-[#BA9B5F]/30 bg-[#132B23]">
                    <div className="w-full px-8 py-20 text-center">
                        <h2 className="font-[family-name:var(--font-fraunces)] text-2xl text-[#E9E0CF]">
                            Start your first campaign today
                        </h2>
                        <a href="/register" className="mt-6 inline-block rounded-md bg-[#E9E0CF] px-6 py-3 text-sm font-medium text-[#132B23] hover:bg-[#BA9B5F]">
                            Create an account
                        </a>
                    </div>
                </section>
            )}

            <footer className="px-8 py-10 text-center text-xs text-[#132B23]/50">
                Bank AI Calling Platform
            </footer>
        </div>
    );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
    return (
        <div>
            <p className="font-[family-name:var(--font-mono)] text-xs text-[#BA9B5F]">{n}</p>
            <h3 className="mt-2 font-[family-name:var(--font-fraunces)] text-lg text-[#132B23]">
                {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#132B23]/70">{body}</p>
        </div>
    );
}

function Feature({ title, body }: { title: string; body: string }) {
    return (
        <div className="rounded-xl border border-[#BA9B5F]/30 bg-[#F5F0E6] p-6">
            <h3 className="font-[family-name:var(--font-fraunces)] text-lg text-[#132B23]">
                {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#132B23]/70">{body}</p>
        </div>
    );
}