import type { BaniLanguage } from "@/lib/bani/types";

const defaultReplies: Record<BaniLanguage, string[]> = {
  ar: [
    "ممتاز. وش اسم المنشأة؟",
    "تمام، أخذت فكرة عن نشاطكم. في أي مدينة مقر المنشأة؟",
    "ممتاز. وش أهم المنتجات أو العلامات اللي توفرونها؟"
  ],
  en: [
    "Great. What is your establishment name?",
    "Got it. Which city is your establishment based in?",
    "Excellent. What are the main products or brands you supply?"
  ],
  zh: ["很好。贵公司的名称是什么？", "明白了。贵公司位于哪个城市？", "很好。贵公司主要供应哪些产品或品牌？"],
  ur: ["بہترین۔ ادارے کا نام کیا ہے؟", "ٹھیک ہے۔ ادارے کا مرکزی دفتر کس شہر میں ہے؟", "بہترین۔ آپ کون سی اہم مصنوعات یا برانڈز فراہم کرتے ہیں؟"]
};

export async function sendBaniMessage(message: string, language: BaniLanguage, turn = 0): Promise<string> {
  // TODO: Connect BANI to the Build API and provider-agnostic ModelRouter when the backend is ready.
  // Keeping this boundary independent from any LLM provider lets the UI remain unchanged later.
  void message;
  const replies = defaultReplies[language];
  return Promise.resolve(replies[turn % replies.length]);
}
