"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  HelpCircle,
  MessageCircle,
  BadgeCheck,
  ShieldCheck,
  Zap,
  Bot,
  Megaphone,
  GitBranch,
  CreditCard,
} from "lucide-react";

const faqs = [
  {
    question: "What is a WhatsApp marketing platform?",
    answer:
      "A WhatsApp marketing platform helps you send bulk campaigns, use approved templates, automate replies, manage customer chats, and track campaign performance from one dashboard.",
    icon: MessageCircle,
  },
  {
    question: "Can I send bulk WhatsApp campaigns?",
    answer:
      "Yes. You can import contacts, select your audience, choose an approved template, and send bulk campaigns for offers, updates, reminders, and lead follow-ups.",
    icon: Megaphone,
  },
  {
    question: "Do I need WhatsApp Business API?",
    answer:
      "For professional bulk messaging, automation, templates, and scalable customer communication, WhatsApp Business API is recommended. It gives better control than the normal WhatsApp Business app.",
    icon: ShieldCheck,
  },
  {
    question: "Can I build automation flows without coding?",
    answer:
      "Yes. With drag and drop automation flow, you can create welcome messages, conditions, delays, chatbot replies, lead qualification, coupons, and agent handoff without writing code.",
    icon: GitBranch,
  },
  {
    question: "Does it support chatbot automation?",
    answer:
      "Yes. You can create smart chatbot flows to answer common questions, collect customer details, show options, share pricing, send forms, and route leads to your sales team.",
    icon: Bot,
  },
  {
    question: "Can customers reply to campaigns?",
    answer:
      "Yes. Customers can reply directly on WhatsApp. You can manage replies from the inbox, use automation, or assign chats to your team members.",
    icon: MessageCircle,
  },
  {
    question: "Is it useful for education, ecommerce, hotels, and agencies?",
    answer:
      "Yes. It is useful for admissions, ecommerce offers, booking reminders, service follow-ups, lead generation, customer support, and sales recovery campaigns.",
    icon: BadgeCheck,
  },
  {
    question: "Can I track campaign performance?",
    answer:
      "Yes. You can track campaign reach, responses, clicks, engagement, and customer actions to understand what is working and improve conversions.",
    icon: Zap,
  },
  {
    question: "Is there any setup cost?",
    answer:
      "Setup cost depends on your business requirements, WhatsApp API setup, message volume, automation needs, and custom features. You can start simple and upgrade as your business grows.",
    icon: CreditCard,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

export function Faqs() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="relative overflow-hidden bg-white px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[340px] w-[340px] -translate-x-1/2 rounded-full bg-emerald-100/80 blur-[110px]" />
        <div className="absolute bottom-0 right-0 h-[280px] w-[280px] rounded-full bg-lime-100/80 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#16a34a_1px,transparent_0)] bg-[size:34px_34px] opacity-[0.05]" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        className="mx-auto px-10 w-full max-w-7xl items-start gap-10"
      >
       

        {/* FAQ Accordion */}
        <motion.div variants={container} className="space-y-3">
          {faqs.map((faq, index) => {
            const Icon = faq.icon;
            const isOpen = openIndex === index;

            return (
              <motion.div
                key={faq.question}
                variants={item}
                className={`group overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-300 ${
                  isOpen
                    ? "border-emerald-200 shadow-xl shadow-emerald-100/70"
                    : "border-slate-200 hover:border-emerald-200 hover:shadow-lg hover:shadow-slate-200/60"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="flex w-full items-center gap-4 p-4 text-left sm:p-5"
                  aria-expanded={isOpen}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${
                      isOpen
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                        : "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black leading-5 text-slate-950 sm:text-base">
                      {faq.question}
                    </h3>
                  </div>

                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                      isOpen
                        ? "rotate-180 border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-500 group-hover:border-emerald-200 group-hover:bg-emerald-50 group-hover:text-emerald-700"
                    }`}
                  >
                    <ChevronDown size={18} />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: "auto",
                        opacity: 1,
                        transition: {
                          height: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                          opacity: { duration: 0.2 },
                        },
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                        transition: {
                          height: { duration: 0.22 },
                          opacity: { duration: 0.15 },
                        },
                      }}
                    >
                      <div className="px-4 pb-5 pl-[4.7rem] pr-5 sm:px-5 sm:pb-6 sm:pl-[5.25rem]">
                        <p className="text-sm leading-6 text-slate-500">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </section>
  );
}