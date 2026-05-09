import { Construction, Clock } from "lucide-react";

export const metadata = {
  title: "تحت الصيانة | Under Maintenance",
  robots: "noindex, nofollow",
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="bg-amber-100 p-6 rounded-full">
            <Construction className="w-16 h-16 text-amber-600" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-slate-900">
            الموقع تحت الصيانة
          </h1>
          <p className="text-lg text-slate-600">
            نعمل حالياً على تحديث المنصة لتقديم تجربة أفضل. نعتذر عن الإزعاج ونرجو
            العودة لاحقاً.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-slate-500">
          <Clock className="w-5 h-5" />
          <span>سنعود قريباً</span>
        </div>

        <div className="border-t border-slate-200 pt-6 space-y-2">
          <p className="text-sm text-slate-500 font-medium">
            The site is under maintenance
          </p>
          <p className="text-sm text-slate-400">
            We are currently updating the platform. Please check back later.
          </p>
        </div>
      </div>
    </div>
  );
}
