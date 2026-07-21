"use client";

import { useState, type ElementType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  ChevronDown,
  CreditCard,
  GitBranch,
  Headphones,
  Megaphone,
  MessageCircle,
  ShieldCheck,
  Zap,
} from "lucide-react";

const faqs = [
  {
    question: "What is a WhatsApp marketing platform?",
    answer:
      "A WhatsApp marketing platform helps you send campaigns, automate customer replies, manage chats, follow up with leads, and track performance from one simple dashboard.",
    icon: MessageCircle,
  },
  {
    question: "Can I send bulk WhatsApp campaigns?",
    answer:
      "Yes. You can import contacts, select your audience, choose an approved WhatsApp template, and send campaigns for offers, updates, reminders, and lead follow-ups.",
    icon: Megaphone,
  },
  {
    question: "Do I need the WhatsApp Business API?",
    answer:
      "Yes. The WhatsApp Business API is recommended for professional bulk messaging, approved templates, automation, team access, and scalable customer communication.",
    icon: ShieldCheck,
  },
  {
    question: "Can I build automation flows without coding?",
    answer:
      "Yes. The drag-and-drop flow builder lets you create welcome messages, delays, conditions, chatbot replies, lead qualification, and agent handoffs without coding.",
    icon: GitBranch,
  },
  {
    question: "Does the platform support chatbot automation?",
    answer:
      "Yes. You can build chatbot flows to answer questions, collect customer details, show options, qualify leads, and transfer conversations to your sales team.",
    icon: Bot,
  },
  {
    question: "Can customers reply to WhatsApp campaigns?",
    answer:
      "Yes. Customers can reply directly on WhatsApp. Your team can manage replies from a shared inbox, assign conversations, or trigger automated responses.",
    icon: MessageCircle,
  },
  {
    question: "Which businesses can use this platform?",
    answer:
      "The platform is useful for education businesses, ecommerce stores, hotels, agencies, real estate companies, service providers, and other lead-driven businesses.",
    icon: BadgeCheck,
  },
  {
    question: "Can I track campaign performance?",
    answer:
      "Yes. You can monitor campaign delivery, responses, clicks, engagement, and customer actions to understand performance and improve future campaigns.",
    icon: Zap,
  },
  {
    question: "Is there any setup cost?",
    answer:
      "The setup cost depends on your WhatsApp API requirements, message volume, automation flows, team size, integrations, and custom features.",
    icon: CreditCard,
  },
];

export const landingFaqs = faqs.map(({ question, answer }) => ({
  question,
  answer,
}));

type FaqItemProps = {
  question: string;
  answer: string;
  icon: ElementType;
  isOpen: boolean;
  onToggle: () => void;
};

function FaqItem({
  question,
  answer,
  icon: Icon,
  isOpen,
  onToggle,
}: FaqItemProps) {
  return (
    <motion.div
      layout
      className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
        isOpen
          ? "border-emerald-200 bg-emerald-50/50 shadow-sm"
          : "border-slate-200 bg-white hover:border-emerald-200 hover:shadow-md"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between cursor-pointer gap-4 p-5 text-left"
      >
        <div className="flex min-w-0 items-center gap-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
              isOpen
                ? "bg-emerald-500 text-white"
                : "bg-emerald-100 text-emerald-600"
            }`}
          >
            <Icon size={20} />
          </div>

          <span className="font-semibold text-slate-900">
            {question}
          </span>
        </div>

        <ChevronDown
          size={20}
          className={`shrink-0 text-slate-400 transition-transform duration-300 ${
            isOpen ? "rotate-180 text-emerald-600" : ""
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="border-t border-emerald-200 px-6 py-4 text-sm leading-7 text-slate-600">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function Faqs() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-slate-50 px-6 py-18">
      {/* Header */}
      <div className="mx-auto mb-12 max-w-6xl text-left">
        <h2 className="text-4xl font-black tracking-tight text-slate-900 lg:text-5xl">
          Frequently Asked{" "}
          <span className="text-emerald-600">Questions</span>
        </h2>

        <p className="mt-4 text-lg text-slate-600">
          Everything you need to know about our platform. Can't find an answer?
          We're here to help.
        </p>
      </div>

      {/* FAQ Layout */}
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-1">

          {/* Contact Support */}
          {/* <div className="h-fit lg:col-span-4">
            <div className="sticky top-24">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Headphones size={24} />
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  Still need help?
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Our team is ready to assist you with your integration and
                  strategy.
                </p>

                <button
                  type="button"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-bold text-white transition hover:bg-emerald-700 active:scale-[0.98]"
                >
                  Contact Support
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div> */}

          {/* FAQ List */}
          <div className="lg:col-span-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.08,
                  },
                },
              }}
            >
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={faq.question}
                    variants={{
                      hidden: {
                        opacity: 0,
                        y: 10,
                      },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: 0.4,
                        },
                      },
                    }}
                  >
                    <FaqItem
                      {...faq}
                      isOpen={openIndex === index}
                      onToggle={() =>
                        setOpenIndex(
                          openIndex === index ? null : index
                        )
                      }
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}