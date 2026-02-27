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
        <div className="w-full">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-5 font-mono">How it works</p>

          <div className="flex items-end justify-center gap-0">

            {/* peer-observer group */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex items-center gap-0 px-3 pt-3 pb-2 rounded-xl border border-white/10"
                style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
              >
                {steps.slice(0, 4).map((step, i) => (
                  <div key={step.label} className="flex items-center">
                    <div className="flex flex-col items-center gap-1.5 w-20">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl border border-white/10"
                        style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                      >
                        {step.icon}
                      </div>
                      <span className="text-white/60 text-[10px] font-semibold leading-tight">{step.label}</span>
                      <span className="text-white/25 text-[9px] leading-tight">{step.desc}</span>
                    </div>
                    {i < 3 && (
                      <div className="flex flex-col items-center mx-1 mb-6">
                        <div className="w-5 h-px bg-white/10" />
                        <span className="text-white/15 text-[8px] mt-0.5">▶</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <span className="text-white/25 text-[10px] font-mono tracking-wide">peer-observer</span>
            </div>

            {/* Arrow between groups */}
            <div className="flex flex-col items-center mx-2 mb-10">
              <div className="w-6 h-px bg-[#F7931A]/40" />
              <span className="text-[#F7931A]/40 text-[8px] mt-0.5">▶</span>
            </div>

            {/* c12d group */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex items-center gap-0 px-3 pt-3 pb-2 rounded-xl border"
                style={{
                  backgroundColor: "rgba(247,147,26,0.06)",
                  borderColor: "rgba(247,147,26,0.25)",
                }}
              >
                {steps.slice(4).map((step, i) => (
                  <div key={step.label} className="flex items-center">
                    <div className="flex flex-col items-center gap-1.5 w-20">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl border"
                        style={{
                          backgroundColor: "rgba(247,147,26,0.1)",
                          borderColor: "rgba(247,147,26,0.5)",
                          boxShadow: "0 0 14px rgba(247,147,26,0.2)",
                        }}
                      >
                        {step.icon}
                      </div>
                      <span className="text-white/90 text-[10px] font-semibold leading-tight">{step.label}</span>
                      <span className="text-white/40 text-[9px] leading-tight">{step.desc}</span>
                    </div>
                    {i < 1 && (
                      <div className="flex flex-col items-center mx-1 mb-6">
                        <div className="w-5 h-px bg-[#F7931A]/30" />
                        <span className="text-[#F7931A]/30 text-[8px] mt-0.5">▶</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <span className="text-[#F7931A]/60 text-[10px] font-mono tracking-wide">c12d</span>
            </div>

          </div>
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
