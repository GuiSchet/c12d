import Link from "next/link";
import Image from "next/image";

const steps = [
  { icon: "₿", label: "Bitcoin Node", desc: "Runs Bitcoin Core" },
  { icon: "⚡", label: "Extractor", desc: "Captures P2P events" },
  { icon: "📡", label: "NATS", desc: "Message bus" },
  { icon: "🔌", label: "WebSocket", desc: "Streams live data" },
  { icon: "📊", label: "Dashboard", desc: "Charts & metrics" },
  { icon: "🤖", label: "AI Assistant", desc: "Explains everything" },
];

export default function Home() {
  return (
    <div className="relative min-h-screen w-full bg-black flex items-center justify-center overflow-hidden py-16">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#F7931A]/8 blur-[160px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center gap-10 px-6 max-w-3xl w-full">

        {/* B4OS Logo */}
        <Image
          src="/b4os-logo.png"
          alt="B4OS"
          width={140}
          height={52}
          className="opacity-80"
          priority
        />

        {/* Title */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-8xl font-bold text-white tracking-tighter">c12d</h1>
          <p className="text-[#F7931A] text-xl font-semibold">
            Your AI assistant for Bitcoin network monitoring
          </p>
          <p className="text-white/45 text-sm font-light max-w-md mt-1">
            Ask questions in plain English and get instant insights about what&apos;s happening on the Bitcoin P2P network — open source, real-time analytics for everyone.
          </p>
        </div>

        {/* Architecture diagram */}
        <div className="w-full relative">
          {/* Subtle bg glow behind the whole section */}
          <div className="absolute inset-0 -mx-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm pointer-events-none" />
          <div className="absolute inset-0 -mx-6 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />


          <div className="relative z-10 flex items-end justify-center gap-0 pt-4">

            {/* peer-observer group */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative flex items-center gap-1 px-4 pt-5 pb-4 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md shadow-xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                {steps.slice(0, 4).map((step, i) => (
                  <div key={step.label} className="flex items-center">
                    <div className="flex flex-col items-center gap-2 w-[72px]">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-lg border border-white/10"
                        style={{ backgroundColor: "rgba(255,255,255,0.04)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
                      >
                        <span style={step.label === "Bitcoin Node" ? { color: "#F7931A" } : undefined}>
                          {step.icon}
                        </span>
                      </div>
                      <span className="bg-white/5 border border-white/10 text-white/55 font-mono text-[9px] px-1.5 py-0.5 rounded tracking-wide text-center leading-tight">
                        {step.label}
                      </span>
                      <span className="text-white/25 text-[8px] leading-tight text-center">{step.desc}</span>
                    </div>
                    {i < 3 && (
                      <div className="flex flex-col items-center mx-1 pb-7">
                        <div className="w-4 h-px bg-white/10" />
                        <svg width="4" height="7" viewBox="0 0 5 8" className="mt-0.5" fill="rgba(255,255,255,0.12)">
                          <path d="M0 0 L5 4 L0 8" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <span className="text-white/20 text-[9px] font-mono tracking-widest uppercase">peer-observer</span>
            </div>

            {/* Arrow between groups */}
            <div className="flex flex-col items-center mx-2 pb-11">
              <div className="flex items-center gap-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F7931A]/40 flex-shrink-0" />
                <div className="w-5 h-px bg-gradient-to-r from-[#F7931A]/40 to-[#F7931A]/60" />
                <svg width="5" height="8" viewBox="0 0 5 8" fill="rgba(247,147,26,0.55)">
                  <path d="M0 0 L5 4 L0 8" />
                </svg>
              </div>
            </div>

            {/* c12d group */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="relative flex items-center gap-1 px-4 pt-5 pb-4 rounded-xl border backdrop-blur-md overflow-hidden"
                style={{
                  backgroundColor: "rgba(247,147,26,0.05)",
                  borderColor: "rgba(247,147,26,0.22)",
                  boxShadow: "0 0 28px rgba(247,147,26,0.1)",
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F7931A]/40 to-transparent" />
                {steps.slice(4).map((step, i) => (
                  <div key={step.label} className="flex items-center">
                    <div className="flex flex-col items-center gap-2 w-[72px]">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-lg border"
                        style={{
                          backgroundColor: "rgba(247,147,26,0.09)",
                          borderColor: "rgba(247,147,26,0.35)",
                          boxShadow: "0 0 12px rgba(247,147,26,0.18), inset 0 1px 0 rgba(247,147,26,0.12)",
                        }}
                      >
                        {step.icon}
                      </div>
                      <span className="bg-[#F7931A]/15 border border-[#F7931A]/25 text-[#F7931A]/80 font-mono text-[9px] px-1.5 py-0.5 rounded tracking-wide text-center leading-tight">
                        {step.label}
                      </span>
                      <span className="text-white/35 text-[8px] leading-tight text-center">{step.desc}</span>
                    </div>
                    {i < 1 && (
                      <div className="flex flex-col items-center mx-1 pb-7">
                        <div className="w-4 h-px bg-[#F7931A]/25" />
                        <svg width="4" height="7" viewBox="0 0 5 8" className="mt-0.5" fill="rgba(247,147,26,0.3)">
                          <path d="M0 0 L5 4 L0 8" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <span className="text-[#F7931A]/50 text-[9px] font-mono tracking-widest uppercase">c12d</span>
            </div>

          </div>
          <div className="pb-4" />
        </div>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-black text-lg transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ backgroundColor: "#F7931A", boxShadow: "0 0 50px rgba(247,147,26,0.45)" }}
        >
          Open Dashboard
          <span className="text-xl">→</span>
        </Link>

        {/* Footer tagline */}
        <p className="text-white/20 text-xs font-mono max-w-sm leading-relaxed">
          Powered by peer-observer · open source · real-time P2P data
        </p>
      </div>
    </div>
  );
}
