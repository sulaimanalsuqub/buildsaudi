import { Wrench, Clock, Mail, ArrowRight, RefreshCw } from "lucide-react";
import { useState } from "react";

export const metadata = {
  title: "تحت الصيانة | Build Saudi",
  robots: "noindex, nofollow",
};

export default function MaintenancePage() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    setSubscribed(true);
    setLoading(false);
    setTimeout(() => {
      setSubscribed(false);
      setEmail("");
    }, 2500);
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 py-12 overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_0.6px,transparent_1px)] [background-size:50px_50px] opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(#34d399_0.8px,transparent_1px)] [background-size:80px_80px] opacity-10" />

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-3xl p-10 shadow-2xl">
          {/* Logo */}
          <div className="mb-10 flex justify-center">
            <img
              src="/brand/logo-ar.svg"
              alt="Build Saudi"
              className="h-20 w-auto drop-shadow-xl"
            />
          </div>

          {/* Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
              <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 shadow-2xl">
                <Wrench className="h-14 w-14 text-white" strokeWidth={1.8} />
              </div>
            </div>
          </div>

          <h1 className="mb-3 text-center text-4xl font-bold tracking-tighter text-white">
            نُجري تحديثات مهمة
          </h1>

          <p className="mb-10 text-center text-lg text-white/70 leading-relaxed">
            نعمل حالياً على تطوير المنصة لتكون أسرع وأفضل. <br />
            سنعود أقوى خلال وقت قصير.
          </p>

          {/* Progress */}
          <div className="mb-10">
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-[85%] bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full animate-[progress_3s_linear_infinite]" />
            </div>
            <p className="mt-3 text-center text-xs text-white/50 tracking-widest">85% COMPLETE</p>
          </div>

          {/* Subscribe Form */}
          <div className="mb-8">
            {!subscribed ? (
              <form onSubmit={handleSubscribe} className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Mail className="h-4 w-4" />
                  أخبرني متى ننتهي
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 px-8 py-4 rounded-2xl text-white flex items-center gap-2 transition-all active:scale-95"
                  >
                    {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                  </button>
                </div>
              </form>
            ) : (
              <div className="rounded-2xl bg-emerald-500/20 border border-emerald-500/30 p-6 text-center text-emerald-300">
                ✅ شكراً لك! سنرسل لك إشعاراً فور الانتهاء.
              </div>
            )}
          </div>

          <div className="flex justify-center items-center gap-6 text-xs text-white/40">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>سنعود قريباً</span>
            </div>
            <div>•</div>
            <div>Under Maintenance</div>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-white/30">
          Build Saudi © {new Date().getFullYear()} • جميع الحقوق محفوظة
        </p>
      </div>
    </main>
  );
}
