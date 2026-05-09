import { Check, Zap, Rocket, Crown, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { cn } from "../utils/cn";

const PLANS = [
  {
    name: "Starter",
    price: "0",
    description: "Perfect for testing and small scale messaging.",
    icon: <Zap size={24} className="text-blue-600" />,
    features: [
      "1,000 Messages/mo",
      "Basic Analytics",
      "Meta API Integration",
      "1 WhatsApp Number",
      "Standard Support"
    ],
    cta: "Current Plan",
    current: true,
    color: "bg-blue-50"
  },
  {
    name: "Growth",
    price: "1,999",
    description: "Ideal for growing businesses with high engagement.",
    icon: <Rocket size={24} className="text-brand-600" />,
    features: [
      "10,000 Messages/mo",
      "Advanced Analytics",
      "Bulk Campaigns",
      "Contact Segments",
      "Priority Email Support",
      "Custom Webhooks"
    ],
    cta: "Upgrade to Growth",
    popular: true,
    color: "bg-brand-50"
  },
  {
    name: "Enterprise",
    price: "4,999",
    description: "For large scale operations requiring maximum power.",
    icon: <Crown size={24} className="text-amber-600" />,
    features: [
      "Unlimited Messages*",
      "Real-time Dashboards",
      "Multiple Workspaces",
      "Team Collaboration",
      "Dedicated Account Manager",
      "SLA Guarantee"
    ],
    cta: "Contact Sales",
    color: "bg-amber-50"
  }
];

export default function PricingPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-12 p-4 md:p-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black tracking-tight text-slate-900">Choose Your Plan</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
          Scale your WhatsApp engagement with flexible plans designed for every stage of your business growth.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <Card 
            key={plan.name}
            className={cn(
              "p-8 border-none shadow-xl flex flex-col relative overflow-hidden transition-all hover:scale-[1.02] duration-300 rounded-[5px]",
              plan.popular ? "ring-2 ring-brand-600 shadow-brand-500/10" : "shadow-slate-200/50"
            )}
          >
            {plan.popular && (
              <div className="absolute top-4 right-4 bg-brand-600 text-white text-[10px] font-black px-3 py-1 rounded-[5px] uppercase tracking-widest">
                Most Popular
              </div>
            )}

            <div className={cn("w-14 h-14 rounded-[5px] flex items-center justify-center mb-6", plan.color)}>
              {plan.icon}
            </div>

            <h3 className="text-2xl font-black text-slate-900">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-black text-slate-900">₹{plan.price}</span>
              <span className="text-slate-400 font-bold text-sm">/month</span>
            </div>
            
            <p className="mt-4 text-slate-500 text-sm font-medium leading-relaxed">
              {plan.description}
            </p>

            <div className="my-8 h-px bg-slate-50" />

            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="bg-emerald-50 text-emerald-600 p-1 rounded-[5px] shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className={cn(
                "w-full h-14 rounded-[5px] font-black transition-all group",
                plan.current 
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed hover:bg-slate-100" 
                  : plan.popular 
                    ? "bg-brand-600 hover:bg-brand-700 text-white" 
                    : "bg-slate-900 hover:bg-black text-white"
              )}
              disabled={plan.current}
            >
              {plan.cta}
              {!plan.current && <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </Card>
        ))}
      </div>

      {/* Comparison Note */}
      <div className="bg-white rounded-[5px] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
         <div className="flex items-center gap-4">
            <div className="p-4 bg-brand-50 rounded-[5px] text-brand-600">
               <Zap size={32} />
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-900">Need a custom enterprise solution?</h4>
               <p className="text-slate-500 font-medium">Get in touch for custom message volumes and specialized integrations.</p>
            </div>
         </div>
         <Button variant="outline" className="h-12 px-8 rounded-[5px] border-2 border-slate-900 text-slate-900 font-black hover:bg-slate-900 hover:text-white">
            Talk to Sales
         </Button>
      </div>
    </div>
  );
}
