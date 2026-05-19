import { Wrench, Clock, Mail, ArrowRight } from "lucide-react";
import { useState } from "react";

export const metadata = {
  title: "تحت الصيانة | Build Saudi",
  robots: "noindex, nofollow",
};

export default function MaintenancePage() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      // TODO: Add API call to save email later
      setTimeout(() => {
        setSubscribed(false);
        setEmail("");
      }, 2500);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 py-12 overflow-hidden bg-[#f8fafc]">
      {/* Background Elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(#09914b_0.8px,transparent_1px)] [background-size:40px_40px] opacity-10" />
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-brand-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-brand-accent/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="rounded-3xl border border-white/70 bg-white/90 p-10 shadow-2xl backdrop-blur-2xl md:p-14">
          {/* Logo */}
          <div className="mb-10 flex justify-center">
            <img
              src="/brand/logo-ar.svg"
              alt="Build Saudi"
              className="h-16 w-auto drop-shadow-md"
            />
          </div>

          {/* Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-brand-primary/20 animate-ping" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary via-brand-primary to-brand-dark shadow-xl">
                <Wrench className="h-12 w-12 text-white" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Content */}
          <h1 className="mb-4 text-center text-4xl font-bold tracking-tight text-brand-dark md:text-5xl">
            نُجري تحديثات مهمة
          </h1>

          <p className="mx-auto mb-10 max-w-[38ch] text-center text-lg leading-relaxed text-brand-dark/70">
            نعمل على تحسين المنصة لتقديم تجربة أسرع وأكثر سلاسة. <br />
            سنعود قريباً جداً إن شاء الله.
          </p>

          {/* Progress Bar */}
          <div className="mb-10 h-1.5 w-full overflow-hidden rounded-full bg-brand-dark/10">
            <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-brand-primary to-brand-accent animate-[shimmer_2.8s_infinite]" />
          </div>

          {/* Subscribe Form */}
          <div className="mb-8">
            {!subscribed ? (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
                <label className="text-sm text-brand-dark/70 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  أخبرني عندما ننتهي
                </label>
                <div className="flex">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="بريدك الإلكتروني"
                    className="flex-1 rounded-l-2xl border border-white/60 bg-white/70 px-5 py-3.5 text-sm focus:outline-none focus:border-brand-primary transition-colors"
                    required
                  />
                  <button
                    type="submit"
                    className="rounded-r-2xl bg-brand-primary px-6 py-3.5 text-white hover:bg-brand-dark transition-all flex items-center gap-2 font-medium"
                  >
                    إرسال <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="rounded-2xl bg-emerald-50 p-5 text-center text-emerald-700 border border-emerald-100">
                ✅ شكراً لك! سنُخطرك فور الإنتهاء.
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center justify-center gap-8 text-sm text-brand-dark/60">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>سنعود قريباً</span>
            </div>
            <div className="h-3 w-px bg-brand-dark/20" />
            <div>Under Maintenance</div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-brand-dark/40">
          Build Saudi © {new Date().getFullYear()} • جميع الحقوق محفوظة
        </p>
      </div>

      {/* Shimmer Animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(300%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </main>
  );
}
