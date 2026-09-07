"use client";

import { useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { FileText, Paperclip, Send, X } from "lucide-react";

import type { BaniDirection, BaniLanguage } from "@/lib/bani/types";

export type BaniPickedFile = { name: string; mimeType: string; base64Data: string; sizeLabel: string };

const MAX_FILE_BYTES = 8 * 1024 * 1024;

const content: Record<
  BaniLanguage,
  {
    placeholder: string;
    attachLabel: string;
    sendLabel: string;
    removeLabel: string;
    attachmentHint: string;
    tooLarge: string;
    unsupportedType: string;
  }
> = {
  ar: {
    placeholder: "اكتب عن منشأتك، نشاطك، المنتجات، العلامات... أي شيء",
    attachLabel: "إرفاق ملف PDF",
    sendLabel: "إرسال الرسالة",
    removeLabel: "إزالة الملف",
    attachmentHint: "سيقرأ باني هذا الملف عند إرسال رسالتك التالية",
    tooLarge: "حجم الملف يتجاوز 8 ميجابايت",
    unsupportedType: "باني يقرأ ملفات PDF فقط حالياً"
  },
  en: {
    placeholder: "Tell me about your company, activity, products, brands... anything",
    attachLabel: "Attach a PDF",
    sendLabel: "Send message",
    removeLabel: "Remove file",
    attachmentHint: "BANI will read this file when you send your next message",
    tooLarge: "File size exceeds 8MB",
    unsupportedType: "BANI can only read PDF files right now"
  },
  zh: {
    placeholder: "介绍您的公司、业务、产品、品牌……任何信息都可以",
    attachLabel: "添加 PDF 文件",
    sendLabel: "发送消息",
    removeLabel: "移除文件",
    attachmentHint: "发送下一条消息时，BANI 会读取此文件",
    tooLarge: "文件大小超过 8MB",
    unsupportedType: "BANI 目前只能读取 PDF 文件"
  },
  ur: {
    placeholder: "اپنے ادارے، کاروبار، مصنوعات یا برانڈز کے بارے میں لکھیں",
    attachLabel: "PDF فائل منسلک کریں",
    sendLabel: "پیغام بھیجیں",
    removeLabel: "فائل ہٹائیں",
    attachmentHint: "اگلا پیغام بھیجنے پر BANI یہ فائل پڑھے گا",
    tooLarge: "فائل کا سائز 8MB سے زیادہ ہے",
    unsupportedType: "BANI ابھی صرف PDF فائلیں پڑھ سکتا ہے"
  }
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] || "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type BaniComposerProps = {
  language: BaniLanguage;
  direction: BaniDirection;
  disabled?: boolean;
  onSend: (message: string, attachment?: BaniPickedFile) => void;
};

export function BaniComposer({ language, direction, disabled = false, onSend }: BaniComposerProps) {
  const [value, setValue] = useState("");
  const [attachment, setAttachment] = useState<BaniPickedFile | null>(null);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = content[language];

  const submit = () => {
    const message = value.trim();
    if ((!message && !attachment) || disabled) return;
    onSend(message, attachment ?? undefined);
    setValue("");
    setAttachment(null);
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

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setFileError("");

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setFileError(t.unsupportedType);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError(t.tooLarge);
      return;
    }
    const base64Data = await readFileAsBase64(file);
    setAttachment({ name: file.name, mimeType: "application/pdf", base64Data, sizeLabel: formatFileSize(file.size) });
  };

  return (
    <div className="border-t border-brand-dark/10 bg-white/95 px-3 py-3 backdrop-blur-sm sm:px-5 sm:py-4">
      {fileError && (
        <p className="mb-2 text-xs font-semibold text-red-600" dir={direction}>
          {fileError}
        </p>
      )}
      {attachment && (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-brand-dark/10 bg-brand-light/60 px-3 py-2" dir={direction}>
          <FileText className="h-5 w-5 shrink-0 text-brand-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-brand-dark">{attachment.name}</p>
            <p className="truncate text-[11px] text-brand-dark/55">
              {attachment.sizeLabel} · {t.attachmentHint}
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
          accept="application/pdf,.pdf"
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
          disabled={(!value.trim() && !attachment) || disabled}
          aria-label={t.sendLabel}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-dark text-white transition hover:bg-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
