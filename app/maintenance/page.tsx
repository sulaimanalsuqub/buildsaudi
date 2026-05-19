export default function MaintenancePage() {
  return (
    <>
      <style>{`
        @keyframes meteor {
          0%   { transform: translateX(0) translateY(0) rotate(-45deg); opacity: 1; }
          100% { transform: translateX(600px) translateY(600px) rotate(-45deg); opacity: 0; }
        }
        .meteor {
          position: absolute;
          width: 2px;
          border-radius: 9999px;
          background: linear-gradient(to bottom, #000, transparent);
          animation: meteor linear infinite;
          opacity: 0;
        }
        .meteor::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 4px; height: 4px;
          border-radius: 50%;
          background: #000;
          transform: translate(-1px, -1px);
        }
      `}</style>

      <main className="min-h-screen flex flex-col relative overflow-hidden"
        style={{
          backgroundColor: "#fff",
          backgroundImage: `
            radial-gradient(circle, #00000012 1px, transparent 1px),
            radial-gradient(circle, #00000008 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px, 80px 80px",
          backgroundPosition: "0 0, 20px 20px",
        }}
      >
        {/* Shooting stars */}
        {[
          { top: "5%",  left: "10%", height: 120, delay: "0s",    duration: "3.5s" },
          { top: "15%", left: "55%", height: 80,  delay: "1.2s",  duration: "2.8s" },
          { top: "2%",  left: "75%", height: 150, delay: "2.5s",  duration: "4s"   },
          { top: "30%", left: "30%", height: 60,  delay: "3.8s",  duration: "3s"   },
          { top: "8%",  left: "88%", height: 100, delay: "0.8s",  duration: "3.2s" },
          { top: "20%", left: "5%",  height: 90,  delay: "4.5s",  duration: "2.6s" },
        ].map((m, i) => (
          <div
            key={i}
            className="meteor"
            style={{
              top: m.top,
              left: m.left,
              height: `${m.height}px`,
              animationDelay: m.delay,
              animationDuration: m.duration,
            }}
          />
        ))}

        {/* Top bar */}
        <header className="relative z-10 px-8 py-6 border-b border-black/[0.06]">
          <img src="/brand/logo-ar.svg" alt="Build Saudi" className="h-8 w-auto" />
        </header>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
          {/* Status dot */}
          <div className="flex items-center gap-2 mb-10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-emerald-600 text-xs font-medium tracking-widest uppercase">
              Under Maintenance
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-black font-bold tracking-tight mb-4" style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", lineHeight: 1.1 }}>
            نعود قريباً
          </h1>

          <p className="text-black/40 text-lg max-w-sm leading-relaxed">
            نعمل على تحسينات ستجعل تجربتك أفضل بكثير
          </p>
        </div>

        {/* Bottom bar */}
        <footer className="relative z-10 px-8 py-5 border-t border-black/[0.06] flex items-center justify-between">
          <span className="text-black/20 text-xs">© {new Date().getFullYear()} Build Saudi</span>
          <span className="text-black/20 text-xs">build.sa</span>
        </footer>
      </main>
    </>
  );
}
