"use client";

import { useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { FileText, Paperclip, Send, X } from "lucide-react";

import type { BaniAttachment, BaniDirection, BaniLanguage } from "@/lib/bani/types";

const content: Record<
  BaniLanguage,
  {
    placeholder: string;
    attachLabel: string;
    sendLabel: string;
    removeLabel: string;
    attachmentHint: string;
  }
> = {
  ar: {
    placeholder: "اكتب عن منشأتك، نشاطك، المنتجات، العلامات... أي شيء",
    attachLabel: "إرفاق ملف",
    sendLabel: "إرسال الرسالة",
    removeLabel: "إزالة الملف",
    attachmentHint: "الملف ظاهر في هذه الجلسة فقط ولن يتم رفعه"
  },
  en: {
    placeholder: "Tell me about your company, activity, products, brands... anything",
    attachLabel: "Attach a file",
    sendLabel: "Send message",
    removeLabel: "Remove file",
    attachmentHint: "Shown only in this session and not uploaded"
  },
  zh: {
    placeholder: "介绍您的公司、业务、产品、品牌……任何信息都可以",
    attachLabel: "添加文件",
    sendLabel: "发送消息",
    removeLabel: "移除文件",
    attachmentHint: "文件仅在本次会话中显示，不会上传"
  },
  ur: {
    placeholder: "اپنے ادارے، کاروبار، مصنوعات یا برانڈز کے بارے میں لکھیں",
    attachLabel: "فائل منسلک کریں",
    sendLabel: "پیغام بھیجیں",
    removeLabel: "فائل ہٹائیں",
    attachmentHint: "فائل صرف اس سیشن میں دکھائی جائے گی، اپ لوڈ نہیں ہوگی"
  }
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type BaniComposerProps = {
  language: BaniLanguage;
  direction: BaniDirection;
  disabled?: boolean;
  onSend: (message: string) => void;
};

export function BaniComposer({ language, direction, disabled = false, onSend }: BaniComposerProps) {
  const [value, setValue] = useState("");
  const [attachment, setAttachment] = useState<BaniAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = content[language];

  const submit = () => {
    const message = value.trim();
    if (!message || disabled) return;
    onSend(message);
    setValue("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // TODO: Connect BANI file uploads to Build backend when storage/database is ready.
    setAttachment({ name: file.name, type: file.type || "Unknown", size: file.size });
    event.target.value = "";
  };

  return (
    <div className="border-t border-brand-dark/10 bg-white/95 px-3 py-3 backdrop-blur-sm sm:px-5 sm:py-4">
      {attachment && (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-brand-dark/10 bg-brand-light/60 px-3 py-2" dir={direction}>
          <FileText className="h-5 w-5 shrink-0 text-brand-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-brand-dark">{attachment.name}</p>
            <p className="truncate text-[11px] text-brand-dark/55">
              {attachment.type} · {formatFileSize(attachment.size)} · {t.attachmentHint}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            aria-label={t.removeLabel}
            className="rounded-lg p-2 text-brand-dark/55 transition hover:bg-brand-dark/5 hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2" dir={direction}>
        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          accept=".pdf,.xls,.xlsx,.csv,image/*"
          onChange={handleFileChange}
          aria-label={t.attachLabel}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label={t.attachLabel}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-dark/15 bg-white text-brand-dark transition hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
        >
          <Paperclip className="h-5 w-5" aria-hidden="true" />
        </button>
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.placeholder}
          rows={1}
          disabled={disabled}
          className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-brand-dark/15 bg-white px-4 py-2.5 text-base leading-6 text-brand-dark outline-none transition placeholder:text-brand-dark/40 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          aria-label={t.sendLabel}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-dark text-white transition hover:bg-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
