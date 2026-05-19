export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
        {/* Logo */}
        <img
          src="/brand/logo-ar.svg"
          alt="Build Saudi"
          className="h-16 w-auto mb-16 opacity-90"
        />

        {/* Divider line */}
        <div className="w-12 h-px bg-emerald-500 mb-10" />

        <h1 className="text-3xl font-semibold text-white mb-4 tracking-tight">
          نعمل على تحسين المنصة
        </h1>

        <p className="text-white/50 text-base leading-relaxed">
          سنعود قريباً بتجربة أفضل.
        </p>

        {/* Divider line */}
        <div className="w-12 h-px bg-white/10 mt-12" />

        <p className="mt-6 text-[11px] text-white/20 tracking-widest uppercase">
          Under Maintenance
        </p>
      </div>
    </main>
  );
}
