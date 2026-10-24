import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/app/AppNav";
import { LandingBounty, LandingKopiBot } from "@/components/landing/LiveBits";
import { ArrowButton } from "@/components/ui/Button";
import { Jebi, type JebiMood } from "@/components/ui/Jebi";
import { Melt, type MeltVariant } from "@/components/ui/Melt";

export const metadata: Metadata = {
  title: "Jebol | A bounty alarm for AI agents that hold money",
};

const STEPS: { n: string; title: string; body: string; mood: JebiMood; tone: "navy" | "cream" | "orange"; melt: MeltVariant | null }[] = [
  {
    n: "01",
    title: "Set a bounty",
    body: "The owner locks some MON as a bounty. The agent may only pay addresses on its list.",
    mood: "idle",
    tone: "navy",
    melt: "glow",
  },
  {
    n: "02",
    title: "Anyone tries",
    body: "Send the agent a message. A fake invoice, a hidden instruction, anything. Each try costs only a small network fee.",
    mood: "think",
    tone: "cream",
    melt: "corner",
  },
  {
    n: "03",
    title: "The alarm goes off",
    body: "If the agent pays someone off its list, that person gets the bounty. In the same moment the agent can no longer pay.",
    mood: "broken",
    tone: "orange",
    melt: "alarm",
  },
];

const POINTS = [
  ["Your list", "It only pays who you approve"],
  ["Your limits", "Per payment and per hour"],
  ["Your money", "Take it out any time"],
  ["Your score", "Grows while it holds out"],
];

// Landing (desain L1 Landing v2).
export default function Landing() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-3 pb-10 sm:px-6">
      <header className="flex items-center justify-between gap-3 px-2 py-5 sm:px-6">
        <Logo />
        <nav aria-label="Sections" className="hidden gap-1 rounded-full bg-white p-1 md:flex">
          {[
            ["#how", "How it works"],
            ["#agents", "Agents"],
            ["#builders", "For builders"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="rounded-full px-4 py-2 text-sm text-ink-2 hover:text-navy">
              {label}
            </a>
          ))}
        </nav>
        <Link href="/app" className="h-10 rounded-full bg-navy px-5 text-sm font-semibold leading-10 text-white hover:bg-[#1a2a55]">
          Open app
        </Link>
      </header>

      <section className="grid gap-3 lg:h-[720px] lg:grid-cols-[1fr_560px]">
        <div className="flex flex-col justify-between gap-10 rounded-[36px] bg-navy p-7 text-white sm:p-12 lg:rounded-[44px] lg:p-14">
          <span className="w-fit rounded-[8px] bg-white/10 px-3 py-1.5 text-[13px] font-semibold text-peach">Live on Monad testnet</span>
          <div className="flex flex-col gap-6">
            <h1 className="font-head text-[44px] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-[60px] xl:text-[70px]">
              Can your AI agent be talked into paying the wrong person?
            </h1>
            <p className="max-w-[520px] text-[17px] leading-relaxed text-white/70 sm:text-lg">
              Put a bounty on your agent. Anyone can try to trick it. If someone does, they get the bounty and your agent stops paying right away.
            </p>
            <div className="flex flex-wrap gap-3">
              <ArrowButton href="/app/agent/kopibot">Try to break an agent</ArrowButton>
              <a href="#builders" className="inline-flex h-12 items-center rounded-full border-[1.5px] border-white/30 px-6 text-[15px] font-semibold hover:bg-white/10">
                Protect my agent
              </a>
            </div>
          </div>
        </div>
        <div className="relative h-[420px] overflow-hidden rounded-[36px] bg-cream sm:h-[520px] lg:h-auto lg:rounded-[44px]">
          <Melt variant="rise" />
          <Jebi mood="idle" size={680} priority className="anim-bob absolute -bottom-24 left-1/2 w-[120%] max-w-[680px] -translate-x-1/2" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-orange" />
          <LandingBounty />
        </div>
      </section>

      <section id="how" className="scroll-mt-6 pt-24 sm:pt-32">
        <SectionHead title="How it works" sub="Every try, payment and alarm is recorded on Monad. Anyone can check it." />
        <div className="grid gap-3 md:grid-cols-3">
          {STEPS.map((s) => {
            const light = s.tone !== "cream";
            const bottomText = s.tone === "orange";
            return (
              <article
                key={s.n}
                className={`relative flex h-[480px] flex-col overflow-hidden rounded-[36px] p-8 lg:h-[560px] ${
                  s.tone === "navy" ? "bg-navy text-white" : s.tone === "orange" ? "bg-orange text-white" : "bg-cream"
                } ${bottomText ? "justify-end" : ""}`}
              >
                {s.melt ? <Melt variant={s.melt} className={s.tone === "navy" ? "opacity-80" : ""} /> : null}
                <Jebi
                  mood={s.mood}
                  size={420}
                  className={`absolute w-[86%] max-w-[420px] ${
                    s.tone === "navy" ? "-bottom-16 -right-10" : s.tone === "cream" ? "-bottom-14 -left-24" : "-top-10 left-1/2 -translate-x-1/2"
                  }`}
                />
                {s.tone === "navy" ? <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-navy" /> : null}
                <div className="relative flex max-w-[320px] flex-col gap-3">
                  <span className={`font-head text-[15px] font-semibold ${light ? "text-white/70" : "text-ink-2"}`}>{s.n}</span>
                  <h3 className="font-head text-[30px] font-semibold tracking-[-0.035em]">{s.title}</h3>
                  <p className={`text-[15px] leading-relaxed ${light ? "text-white/80" : "text-navy/80"}`}>{s.body}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="agents" className="scroll-mt-6 pt-24 sm:pt-32">
        <SectionHead title="Agents" sub="The longer an agent holds out, the higher its score." />
        <div className="grid gap-3 lg:grid-cols-[1fr_440px]">
          <LandingKopiBot />
          <article className="relative flex min-h-[420px] flex-col overflow-hidden rounded-[36px] bg-white p-8">
            <h3 className="font-head text-[30px] font-semibold tracking-[-0.035em]">Your agent here</h3>
            <p className="mt-2 max-w-[300px] text-[15px] leading-relaxed text-ink-2">Add Jebol to an agent that holds money. Jebi will guard its bounty.</p>
            <a
              href="#builders"
              className="mt-5 inline-flex h-10 w-fit items-center rounded-full border-[1.5px] border-navy px-4 text-sm font-semibold hover:bg-navy hover:text-white"
            >
              Protect my agent
            </a>
            <Jebi mood="gift" size={420} className="absolute -bottom-10 -right-10 w-[78%] max-w-[420px]" />
          </article>
        </div>
      </section>

      <section id="builders" className="grid scroll-mt-6 gap-3 pt-24 sm:pt-32 lg:grid-cols-[1fr_440px]">
        <div className="flex flex-col justify-between gap-12 rounded-[36px] bg-navy p-8 text-white sm:p-14 lg:rounded-[44px]">
          <div className="flex max-w-[560px] flex-col gap-4">
            <h2 className="font-head text-[40px] font-semibold tracking-[-0.04em] sm:text-[52px]">For agent builders</h2>
            <p className="text-lg leading-relaxed text-white/70">
              Add Jebol to your agent&apos;s wallet. You choose who it may pay and how much. Your main funds stay yours.
            </p>
            <span className="mt-2 inline-flex h-12 w-fit items-center rounded-full bg-white/10 px-6 text-[15px] font-semibold text-white/80">
              Self-serve setup is coming soon
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {POINTS.map(([t, d]) => (
              <div key={t} className="border-t border-white/15 pt-4">
                <dt className="font-semibold">{t}</dt>
                <dd className="mt-1 text-sm text-white/55">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative h-[420px] overflow-hidden rounded-[36px] bg-orange lg:h-auto lg:rounded-[44px]">
          <Melt variant="alarm" />
          <Jebi mood="safe" size={520} className="absolute -bottom-20 left-1/2 w-[110%] max-w-[520px] -translate-x-1/2" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-orange" />
        </div>
      </section>

      <footer className="mt-16 flex flex-col items-center justify-between gap-4 px-2 text-sm text-ink-2 sm:flex-row sm:px-6">
        <Logo />
        <span>Made for Monad Blitz Jogja 2026</span>
        <span className="flex gap-6">
          <a href="https://monad.xyz" target="_blank" rel="noreferrer" className="hover:text-navy">
            Monad
          </a>
          <Link href="/app" className="hover:text-navy">
            App
          </Link>
        </span>
      </footer>
    </div>
  );
}

function SectionHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-3 px-2 sm:flex-row sm:items-end sm:px-6">
      <h2 className="font-head text-[40px] font-semibold tracking-[-0.04em] sm:text-[52px]">{title}</h2>
      <p className="max-w-[380px] text-[17px] leading-relaxed text-ink-2">{sub}</p>
    </div>
  );
}
