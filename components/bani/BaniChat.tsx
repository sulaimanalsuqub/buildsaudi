"use client";

import { useEffect, useRef, useState } from "react";

import { BaniComposer } from "@/components/bani/BaniComposer";
import { BaniMessage } from "@/components/bani/BaniMessage";
import { sendBaniMessage } from "@/lib/bani/mock";
import { baniDirections, type BaniLanguage, type BaniMessage as BaniMessageType } from "@/lib/bani/types";

const chatContent: Record<
  BaniLanguage,
  { greeting: string; quickActions: string[]; thinking: string; changeLanguage: string }
> = {
  ar: {
    greeting: "حياك الله، أنا باني ✦\nلاهنت أرسل لي أي شيء يتعلق بشركتك.",
    quickActions: ["اسم المنشأة", "نشاط الشركة", "المنتجات", "العلامات التجارية", "المدينة"],
    thinking: "باني يرتّب المعلومات...",
    changeLanguage: "تغيير اللغة"
  },
  en: {
    greeting: "Welcome, I’m BANI ✦\nSend me anything about your company and I’ll organize it for registration.",
    quickActions: ["Company name", "Business activity", "Products", "Brands", "City"],
    thinking: "BANI is organizing the details...",
    changeLanguage: "Change language"
  },
  zh: {
    greeting: "您好，我是 BANI ✦\n请发送任何与贵公司有关的信息，我会为您整理注册资料。",
    quickActions: ["公司名称", "主营业务", "产品", "品牌", "城市"],
    thinking: "BANI 正在整理信息……",
    changeLanguage: "更改语言"
  },
  ur: {
    greeting: "خوش آمدید، میں BANI ہوں ✦\nاپنی کمپنی کے بارے میں کوئی بھی معلومات بھیجیں، میں رجسٹریشن کے لیے ترتیب دے دوں گا۔",
    quickActions: ["ادارے کا نام", "کاروباری سرگرمی", "مصنوعات", "برانڈز", "شہر"],
    thinking: "BANI معلومات ترتیب دے رہا ہے...",
    changeLanguage: "زبان تبدیل کریں"
  }
};

type BaniChatProps = {
  language: BaniLanguage;
  onChangeLanguage: () => void;
};

export function BaniChat({ language, onChangeLanguage }: BaniChatProps) {
  const t = chatContent[language];
  const direction = baniDirections[language];
  const nextId = useRef(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<BaniMessageType[]>([
    { id: "assistant-initial", role: "assistant", content: t.greeting }
  ]);
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, isReplying]);

  const handleSend = async (content: string) => {
    const userMessage: BaniMessageType = { id: `user-${nextId.current++}`, role: "user", content };
    setMessages((current) => [...current, userMessage]);
    setIsReplying(true);

    try {
      const turn = messages.filter((message) => message.role === "user").length;
      const response = await sendBaniMessage(content, language, turn);
      setMessages((current) => [
        ...current,
        { id: `assistant-${nextId.current++}`, role: "assistant", content: response }
      ]);
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col" dir={direction} lang={language}>
      <div className="flex items-center justify-between gap-3 border-b border-brand-dark/10 bg-white/70 px-4 py-3 sm:px-5">
        <div>
          <p className="text-sm font-bold tracking-[0.12em] text-brand-primary">✦ BANI</p>
        </div>
        <button
          type="button"
          onClick={onChangeLanguage}
          className="rounded-lg px-3 py-2 text-xs font-semibold text-brand-dark/70 transition hover:bg-brand-dark/5 hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
        >
          {t.changeLanguage}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-brand-light/35 px-3 py-4 sm:px-5 sm:py-5" aria-live="polite">
        <div className="space-y-4">
          {messages.map((message) => (
            <BaniMessage key={message.id} message={message} />
          ))}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {t.quickActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  disabled={isReplying}
                  onClick={() => handleSend(action)}
                  className="rounded-full border border-brand-dark/15 bg-white px-3 py-2 text-xs font-medium text-brand-dark/75 transition hover:border-brand-primary hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 disabled:pointer-events-none disabled:opacity-50"
                >
                  {action}
                </button>
              ))}
            </div>
          )}
          {isReplying && <p className="px-2 text-xs text-brand-dark/50">{t.thinking}</p>}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <BaniComposer language={language} direction={direction} disabled={isReplying} onSend={handleSend} />
    </div>
  );
}
