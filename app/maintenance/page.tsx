export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-black flex flex-col">
      {/* Top bar */}
      <header className="px-8 py-6 border-b border-white/[0.06]">
        <img src="/brand/logo-ar.svg" alt="Build Saudi" className="h-8 w-auto" />
      </header>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Status dot */}
        <div className="flex items-center gap-2 mb-10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-emerald-400 text-xs font-medium tracking-widest uppercase">
            Under Maintenance
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-white font-bold tracking-tight mb-4" style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", lineHeight: 1.1 }}>
          نعود قريباً
        </h1>

        <p className="text-white/40 text-lg max-w-sm leading-relaxed">
          نعمل على تحسينات ستجعل تجربتك أفضل بكثير
        </p>
      </div>

      {/* Bottom bar */}
      <footer className="px-8 py-5 border-t border-white/[0.06] flex items-center justify-between">
        <span className="text-white/20 text-xs">© {new Date().getFullYear()} Build Saudi</span>
        <span className="text-white/20 text-xs">build.sa</span>
      </footer>
    </main>
  );
}
