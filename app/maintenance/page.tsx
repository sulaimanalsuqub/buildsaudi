import { Wrench, Clock, AlertCircle } from "lucide-react";

export const metadata = {
  title: "تحت الصيانة | Under Maintenance",
  robots: "noindex, nofollow",
};

export default function MaintenancePage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 py-16 overflow-hidden">
      {/* Ambient orbs for depth */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] h-[500px] w-[500px] rounded-full bg-brand-primary/10 blur-[100px]" />
        <div className="absolute -bottom-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-brand-accent/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Glass Card */}
        <div className="rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-premium backdrop-blur-xl md:p-10">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <img
              src="/brand/logo-ar.svg"
              alt="Build Saudi"
              className="h-12 w-auto select-none md:h-14"
            />
          </div>

          {/* Status Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-brand-primary/20 animate-ping" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-dark shadow-lg">
                <Wrench className="h-9 w-9 text-white" strokeWidth={1.8} />
              </div>
            </div>
          </div>

          {/* Headline */}
          <div className="mb-3 text-center">
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-brand-dark md:text-[34px]">
              نُجري تحديثات
            </h1>
          </div>

          {/* Subhead */}
          <p className="mx-auto mb-8 max-w-[32ch] text-center text-[17px] leading-relaxed text-brand-dark/70 md:text-lg">
            نعمل حالياً على تحسين المنصة لتقديم تجربة أفضل لك. نعتذر عن الإزعاج المؤقت.
          </p>

          {/* Animated progress strip */}
          <div className="mb-8 overflow-hidden rounded-full bg-brand-dark/5 p-[3px]">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-brand-dark/5">
              <div
                className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-gradient-to-r from-brand-primary to-brand-accent"
                style={{
                  animation: "shimmer 2s infinite ease-in-out",
                }}
              />
            </div>
          </div>

          {/* Info row */}
          <div className="flex items-center justify-center gap-6 text-sm text-brand-dark/60">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-primary" strokeWidth={2} />
              <span className="font-medium">سنعود قريباً</span>
            </div>
            <div className="h-4 w-px bg-brand-dark/15" />
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-brand-accent" strokeWidth={2} />
              <span className="font-medium">Under Maintenance</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[13px] text-brand-dark/40">
          Build Saudi &copy; {new Date().getFullYear()}
        </p>
      </div>

      {/* Inline keyframes for the shimmer bar */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-120%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(220%); }
        }
      `}</style>
    </main>
  );
}
