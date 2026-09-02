import type { BaniMessage as BaniMessageType } from "@/lib/bani/types";
import { cn } from "@/lib/utils";

type BaniMessageProps = {
  message: BaniMessageType;
};

export function BaniMessage({ message }: BaniMessageProps) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={cn("flex", isAssistant ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-7 sm:max-w-[78%]",
          isAssistant
            ? "rounded-ss-md border border-brand-dark/10 bg-white text-brand-dark shadow-sm"
            : "rounded-se-md bg-brand-dark text-white"
        )}
      >
        {isAssistant && <span className="mb-1 block text-xs font-bold text-brand-primary">✦ BANI</span>}
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
