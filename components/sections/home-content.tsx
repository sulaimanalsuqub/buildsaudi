"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

import { Container } from "@/components/ui/container";

type HomeContentProps = {
  isRtl?: boolean;
};

const categories = [
  { en: "Building Materials", ar: "مواد بناء وإنشاء", icon: "🏗️" },
  { en: "Safety Tools", ar: "أدوات السلامة", icon: "🦺" },
  { en: "Paint & Decor", ar: "دهانات وديكور", icon: "🎨" },
  { en: "Electrical & Lighting", ar: "كهرباء وإنارة", icon: "💡" },
  { en: "Plumbing", ar: "سباكة", icon: "🔧" },
  { en: "Sanitary Ware", ar: "أدوات صحية", icon: "🚿" },
  { en: "HVAC", ar: "تكييف وتبريد", icon: "❄️" },
  { en: "Piping Systems", ar: "أنظمة الأنابيب", icon: "🔩" },
  { en: "Pumps & Tanks", ar: "مضخات وخزانات", icon: "🛢️" },
  { en: "Flooring & Ceramics", ar: "أرضيات وسيراميك", icon: "🪨" },
  { en: "Insulation", ar: "عوازل", icon: "🧱" },
  { en: "Adhesives", ar: "مواد لاصقة", icon: "🔗" },
];

export function HomeContent({ isRtl = false }: HomeContentProps) {
  const t = {
    heroTitle: isRtl ? "أسرع طريقة لتوريد مشاريعكم" : "The Fastest Way to Supply Your Projects",
    heroSub: isRtl
      ? "رحلة البناء أسهل وأسرع"
      : "A clearer and faster supply workflow for construction projects.",
    primaryCta: isRtl ? "اطلب المنتجات" : "Order Products",
    secondaryCta: isRtl ? "تحدث مع خبير" : "Talk to an Expert",
    badge: isRtl ? "أسرع طريق لتوريد منتجات البناء" : "Build Construction Supply Platform",
    stat1: isRtl ? "طلبات اليوم" : "Today Requests",
    stat2: isRtl ? "موردون نشطون" : "Active Suppliers",
    stat3: isRtl ? "سرعة التوريد" : "Supply Speed",
    categoriesTitle: isRtl ? "فئات التوريد" : "Supply Categories",
    categoriesSub: isRtl
      ? "حلول متكاملة من منتجات البناء والتشطيب"
      : "We connect you with specialized suppliers across all construction material categories",
    howTitle: isRtl ? "كيف نشتغل؟" : "How Build Works",
    howSub: isRtl
      ? "ثلاث خطوات بسيطة من الطلب إلى التسليم"
      : "Three simple steps from request to delivery",
    ctaTitle: isRtl ? "جاهز تبدأ توريد مشروعك؟" : "Ready to Supply Your Project?",
    ctaSub: isRtl
      ? "سجّل الآن وابدأ باستقبال عروض الأسعار لمشاريعك"
      : "Register now and start receiving quotes for your projects",
    ctaBtn: isRtl ? "سجّل كمورد" : "Register as Vendor",
    faqTitle: isRtl ? "أسئلة شائعة" : "Frequently Asked Questions",
    faqSub: isRtl ? "إجابات على أكثر الأسئلة تكراراً" : "Answers to the most commonly asked questions",
    faq: isRtl
      ? [
          { q: "كيف أطلب عرض سعر؟", a: "اضغط على \"اطلب المنتجات\" وعبّئ نموذج الطلب بتفاصيل مشروعك والمواد المطلوبة. سيتواصل معك فريقنا خلال 24 ساعة بعرض سعر شامل." },
          { q: "كم يستغرق استلام عرض السعر؟", a: "عادةً خلال 24-48 ساعة من تقديم الطلب، حسب نوع وكمية المواد المطلوبة." },
          { q: "هل التوصيل مشمول في السعر؟", a: "نعم، جميع أسعارنا تشمل التوصيل والجمارك مباشرة إلى موقع مشروعك." },
          { q: "ما هي طرق الدفع المتاحة؟", a: "نوفر تحويل بنكي وشيكات. تفاصيل الدفع تُرسل مع العرض بعد موافقتك." },
          { q: "هل يمكنني تعديل الطلب بعد إرساله؟", a: "نعم، يمكنك التواصل مع فريقنا لتعديل أي تفاصيل قبل تأكيد العرض النهائي." },
        ]
      : [
          { q: "How do I request a quote?", a: "Click \"Order Products\" and fill out the form with your project details and required materials. Our team will contact you within 24 hours with a comprehensive quote." },
          { q: "How long does it take to receive a quote?", a: "Usually within 24-48 hours of submitting your request, depending on the type and quantity of materials required." },
          { q: "Is delivery included in the price?", a: "Yes, all our prices include delivery and customs (DDP) directly to your project site." },
          { q: "What payment methods are available?", a: "We offer bank transfer and cheques. Payment details are sent with the offer after your approval." },
          { q: "Can I modify my order after submitting?", a: "Yes, you can contact our team to modify any details before confirming the final offer." },
        ],
    testimonialsTitle: isRtl ? "ماذا يقول عملاؤنا" : "What Our Clients Say",
    testimonials: isRtl
      ? [
          { name: "م. خالد العتيبي", company: "شركة إعمار البناء", text: "تعاملنا مع بيلد في 3 مشاريع وكل مرة نستلم المواد في الوقت المحدد بأسعار منافسة." },
          { name: "أ. فهد الشمري", company: "مؤسسة الشمري للمقاولات", text: "خدمة ممتازة وسرعة في الرد. وفّروا علينا وقت كبير في البحث عن الموردين." },
          { name: "م. سارة المالكي", company: "مجموعة المالكي", text: "أسعار شفافة وتوصيل مباشر للموقع. ننصح فيهم لأي مقاول يبحث عن مواد بناء." },
        ]
      : [
          { name: "Eng. Khalid Al-Otaibi", company: "Emaar Construction Co.", text: "We worked with Build on 3 projects and every time we received materials on time at competitive prices." },
          { name: "Mr. Fahad Al-Shammari", company: "Al-Shammari Contracting", text: "Excellent service and quick response. They saved us significant time searching for suppliers." },
          { name: "Eng. Sarah Al-Malki", company: "Al-Malki Group", text: "Transparent pricing and direct delivery to site. We recommend them for any contractor looking for building materials." },
        ],
    steps: isRtl
      ? [
          {
            title: "أرسل طلبك",
            desc: "حدد المواد والكميات التي يحتاجها مشروعك وأرسل الطلب عبر المنصة",
            icon: "📋",
          },
          {
            title: "استلم عرض السعر",
            desc: "يصلك عرض سعر نهائي وشامل من بيلد خلال وقت قصير",
            icon: "💰",
          },
          {
            title: "استلم موادك في الموقع",
            desc: "بعد الموافقة على العرض، نتولى الشحن والتوصيل مباشرة إلى موقع مشروعك",
            icon: "🚚",
          },
        ]
      : [
          {
            title: "Submit Your Request",
            desc: "Specify the materials and quantities your project needs and submit through the platform",
            icon: "📋",
          },
          {
            title: "Receive a Quote",
            desc: "Get a comprehensive final price quote from Build in a short time",
            icon: "💰",
          },
          {
            title: "Receive at Your Site",
            desc: "Once you approve the quote, we handle shipping and delivery directly to your project site",
            icon: "🚚",
          },
        ],
  };

  return (
    <main dir={isRtl ? "rtl" : "ltr"}>

      {/* ── Hero ── */}
      <section className="py-6 md:py-10">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative mx-auto max-w-[1160px] overflow-hidden rounded-[24px] border border-brand-dark/10 bg-white/80 px-4 py-10 text-center backdrop-blur-sm sm:rounded-[32px] sm:px-8 sm:py-14 md:px-16 md:py-20"
          >
            {/* background gradient */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_8%_14%,rgba(197,217,45,0.18)_0%,transparent_40%),radial-gradient(circle_at_88%_20%,rgba(9,177,75,0.14)_0%,transparent_42%),radial-gradient(circle_at_78%_84%,rgba(29,63,31,0.09)_0%,transparent_44%)]"
            />

            <div className="relative z-10">
              {/* badge */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="type-small mx-auto w-fit rounded-full border border-brand-primary/30 bg-brand-primary/[0.08] px-4 py-1.5 font-semibold text-brand-primary"
              >
                {t.badge}
              </motion.p>

              {/* headline */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.18 }}
                className="type-hero mx-auto mt-5 text-brand-dark"
              >
                {t.heroTitle}
              </motion.h1>

              {/* subheading */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.26 }}
                className="type-subheading mx-auto mt-4 max-w-xl text-brand-dark/60"
              >
                {t.heroSub}
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.34 }}
                className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
              >
                <Link
                  href={isRtl ? "/ar/get-quote" : "/get-quote"}
                  className="rounded-full bg-brand-primary px-8 py-3.5 type-button text-white transition-all hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 text-center"
                >
                  {t.primaryCta}
                </Link>
                <Link
                  href={isRtl ? "/ar/register" : "/register"}
                  className="rounded-full border border-brand-dark/20 bg-white px-8 py-3.5 type-button text-brand-dark transition-all hover:border-brand-dark/40 hover:bg-brand-dark/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark/20 text-center"
                >
                  {t.secondaryCta}
                </Link>
              </motion.div>
            </div>

            {/* stats bar */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.42 }}
              className="relative z-10 mx-auto mt-8 max-w-2xl rounded-2xl border border-brand-dark/10 bg-white/90 p-2 backdrop-blur-sm sm:p-3 md:p-4"
            >
              <div className="flex items-center justify-center px-4 py-3 sm:px-6 sm:py-4">
                <div className="text-center">
                  <p className="text-[11px] leading-tight text-brand-dark/50 sm:text-xs">{t.stat2}</p>
                  <p className="mt-0.5 text-lg font-bold tracking-tight text-brand-dark sm:text-[22px] md:text-2xl">340</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* ── How It Works ── */}
      <section className="py-10 md:py-20">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <div className="mb-10 text-center">
              <h2 className="type-section-title mx-auto text-brand-dark">{t.howTitle}</h2>
              <p className="type-body mx-auto mt-3 text-brand-dark/55">{t.howSub}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {t.steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.12 }}
                  className="flex flex-col items-center gap-4 rounded-[20px] border border-brand-dark/10 bg-white p-5 text-center sm:rounded-[24px] sm:gap-5 sm:p-7"
                >
                  {/* icon circle */}
                  <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full border border-brand-primary/20 bg-gradient-to-br from-brand-primary/[0.10] to-brand-accent/[0.10]">
                    <span className="text-[28px] leading-none">{step.icon}</span>
                    <span className="absolute -end-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-[11px] font-bold text-white">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="type-card-title text-brand-dark">{step.title}</h3>
                    <p className="type-small mt-2 leading-relaxed text-brand-dark/55">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ── Categories ── */}
      <section className="py-10 md:py-20">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <div className="mb-10 text-center">
              <h2 className="type-section-title mx-auto text-brand-dark">{t.categoriesTitle}</h2>
              <p className="type-body mx-auto mt-3 text-brand-dark/55">{t.categoriesSub}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {categories.map((category, index) => (
                <motion.div
                  key={category.en}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.28, delay: index * 0.04 }}
                  className="group flex items-center gap-3 rounded-[20px] border border-brand-dark/10 bg-white p-4 transition-all hover:border-brand-primary/30"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/[0.08] text-xl transition-colors group-hover:bg-brand-primary/[0.14]">
                    {category.icon}
                  </div>
                  <p className="type-small font-semibold leading-snug text-brand-dark">
                    {isRtl ? category.ar : category.en}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-10 md:py-20">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <div className="mb-10 text-center">
              <h2 className="type-section-title mx-auto text-brand-dark">{t.testimonialsTitle}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {t.testimonials.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="rounded-[20px] border border-brand-dark/10 bg-white p-6"
                >
                  <p className="type-small leading-relaxed text-brand-dark/70">&ldquo;{item.text}&rdquo;</p>
                  <div className="mt-4 pt-3 border-t border-brand-dark/5">
                    <p className="text-sm font-bold text-brand-dark">{item.name}</p>
                    <p className="type-small text-brand-dark/45">{item.company}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ── FAQ ── */}
      <section className="py-10 md:py-20">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <div className="mb-10 text-center">
              <h2 className="type-section-title mx-auto text-brand-dark">{t.faqTitle}</h2>
              <p className="type-body mx-auto mt-3 text-brand-dark/55">{t.faqSub}</p>
            </div>
            <div className="mx-auto max-w-2xl space-y-3">
              {t.faq.map((item, i) => (
                <FaqItem key={i} question={item.q} answer={item.a} />
              ))}
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ── CTA ── */}
      <section className="py-10 md:py-20">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="rounded-[24px] border border-brand-primary/20 bg-brand-primary/[0.06] px-6 py-12 text-center sm:rounded-[32px] sm:px-12 md:py-16"
          >
            <h2 className="type-section-title mx-auto text-brand-dark">{t.ctaTitle}</h2>
            <p className="type-body mx-auto mt-3 max-w-lg text-brand-dark/60">{t.ctaSub}</p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link
                href={isRtl ? "/ar/get-quote" : "/get-quote"}
                className="rounded-full bg-brand-primary px-8 py-3.5 type-button text-white transition-all hover:bg-brand-dark text-center"
              >
                {t.primaryCta}
              </Link>
              <Link
                href={isRtl ? "/ar/register" : "/register"}
                className="rounded-full border border-brand-dark/20 bg-white px-8 py-3.5 type-button text-brand-dark transition-all hover:border-brand-dark/40 hover:bg-brand-dark/[0.03] text-center"
              >
                {t.ctaBtn}
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>

    </main>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-brand-dark/10 bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-right"
      >
        <span className="text-sm font-semibold text-brand-dark">{question}</span>
        <span className={`text-brand-dark/40 text-lg shrink-0 transition-transform duration-200 ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm leading-relaxed text-brand-dark/60">{answer}</p>
        </div>
      )}
    </div>
  );
}
