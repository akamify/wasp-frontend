import { useEffect, useState } from "react";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Textarea } from "@components/ui/Textarea";
import { useAuth } from "@shared/providers/AuthContext";
import { useToast } from "@shared/providers/ToastContext";
import { Check, X, Phone, ArrowRight } from "lucide-react";
import { cn } from "@shared/utils/cn";
import { AnimatePresence, motion } from "framer-motion";
import { usePlans } from "@modules/billing/hooks/usePlans";
import { API } from "@api/api";
import { useNavigate } from "react-router-dom";

function SalesContactModal({
    open,
    onClose,
    planName,
}: {
    open: boolean;
    onClose: () => void;
    planName: string;
}) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [busy, setBusy] = useState(false);
    const [form, setForm] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        businessName: "",
        businessAddress: "",
        website: "",
        additionalInfo: "",
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);

        try {
            // Simulate API call - in real scenario, send to backend
            await new Promise((resolve) => setTimeout(resolve, 1000));

            console.log("Sales inquiry:", {
                ...form,
                planName,
                timestamp: new Date().toISOString(),
            });

            toast("Your inquiry has been sent! Our sales team will contact you within 24 hours.", "success");
            onClose();
            setForm({
                name: user?.name || "",
                email: user?.email || "",
                phone: user?.phone || "",
                businessName: "",
                businessAddress: "",
                website: "",
                additionalInfo: "",
            });
        } catch (error) {
            toast("Failed to send inquiry. Please try again.", "error");
        } finally {
            setBusy(false);
        }
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="relative w-full max-w-2xl overflow-hidden rounded-[5px] border border-slate-100 bg-white shadow-2xl"
                        initial={{ y: 20, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 20, opacity: 0, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-brand-600">Sales Inquiry</div>
                                <h2 className="mt-1 text-lg font-black text-slate-900">{planName} Plan Details</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:bg-slate-100 rounded-[5px] transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form className="space-y-4 p-6" onSubmit={handleSubmit}>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Input
                                    label="Full Name *"
                                    value={form.name}
                                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                                <Input
                                    label="Email Address *"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Input
                                    label="Phone Number *"
                                    value={form.phone}
                                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                                    required
                                />
                                <Input
                                    label="Business Name *"
                                    value={form.businessName}
                                    onChange={(e) => setForm((prev) => ({ ...prev, businessName: e.target.value }))}
                                    required
                                />
                            </div>

                            <Input
                                label="Business Address *"
                                value={form.businessAddress}
                                onChange={(e) => setForm((prev) => ({ ...prev, businessAddress: e.target.value }))}
                                placeholder="Street, City, State, Zip"
                                required
                            />

                            <Input
                                label="Website"
                                value={form.website}
                                onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
                                placeholder="https://example.com"
                            />

                            <Textarea
                                label="Additional Information"
                                value={form.additionalInfo}
                                onChange={(e) => setForm((prev) => ({ ...prev, additionalInfo: e.target.value }))}
                                placeholder="Tell us about your business needs..."
                                className="min-h-[100px]"
                            />

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <Button type="button" variant="ghost" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={busy}>
                                    {busy ? "Sending..." : "Submit Inquiry"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default function PlanPage() {
    const { workspace } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const { items: livePlans, loading, error } = usePlans();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [currentModalOpen, setCurrentModalOpen] = useState(false);
    const [currentDetails, setCurrentDetails] = useState<any>(null);

    const plans = (Array.isArray(livePlans) ? livePlans : []).map((p: any) => ({
            id: String(p?.id || p?.slug || p?.name || ""),
            name: p?.name || "Plan",
            price: p?.pricing?.discountedPricePaise == null ? "Custom" : `₹${Math.round(Number(p.pricing.discountedPricePaise) / 100).toLocaleString("en-IN")}`,
            period: p?.planType === "custom" ? "" : "/month",
            description: p?.description || "",
            features: Array.isArray(p?.displayFeatures) ? p.displayFeatures : [],
            notIncluded: Array.isArray(p?.unavailableFeatures) ? p.unavailableFeatures : [],
            cta: p?.buttonText || (p?.planType === "custom" ? "Contact Sales" : "Buy Now"),
            planType: p?.planType || "basic",
            recommended: Boolean(p?.recommended),
            isCurrentPlan: String((workspace?.plan || "").toLowerCase()) === String((p?.slug || "").toLowerCase()),
          }));

    const currentPlan = plans.find((p) => p.isCurrentPlan);

    useEffect(() => {
        let mounted = true;
        API.billing.current()
            .then((res: any) => {
                if (!mounted) return;
                setCurrentDetails(res || null);
            })
            .catch(() => {});
        return () => {
            mounted = false;
        };
    }, []);

    async function handlePlanAction(planName: string) {
        const selected = plans.find((plan) => plan.name === planName);
        if (selected?.planType === "custom") {
            setSelectedPlan(planName);
            return;
        }

        if (planName) {
            // Direct payment for Professional plan
            setPaymentProcessing(true);
            try {
                // Simulate payment processing
                await new Promise((resolve) => setTimeout(resolve, 1500));
                toast("Redirecting to payment gateway...", "success");
                // In real scenario: redirect to payment gateway
                console.log("Processing payment for Professional plan");
            } catch (e: any) {
                toast("Payment initialization failed", "error");
            } finally {
                setPaymentProcessing(false);
            }
        } 
    }

    function getUsageCards() {
        const usage = currentDetails?.usage || {};
        return [
            { key: "contacts", label: "Contacts", data: usage.contacts },
            { key: "templates", label: "Templates", data: usage.templates },
            { key: "employees", label: "Employees", data: usage.employees },
            { key: "campaigns", label: "Campaigns", data: usage.campaigns },
        ];
    }

    return (
        <div className="space-y-8 p-4 md:p-8">
            <div>
                <h1 className="text-4xl font-black tracking-tight text-ink-900">Plans & Pricing</h1>
                <p className="mt-2 text-sm font-semibold text-ink-800/60 uppercase tracking-widest">
                    Choose the perfect plan for your business
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <p className="text-sm font-semibold text-ink-800">
                        Current Plan: <span className="text-brand-600 font-black">{currentPlan?.name} ({workspace?.plan || "Free"})</span>
                    </p>
                    <Button variant="ghost" onClick={() => navigate("/app/plan/history")}>History</Button>
                </div>
            </div>

            {loading ? <Card className="p-6 border-slate-200 text-sm font-semibold text-slate-500">Loading plans...</Card> : null}
            {!loading && error ? <Card className="p-6 border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700">{error}</Card> : null}
            {!loading && !error && plans.length === 0 ? (
                <Card className="p-6 border-slate-200 text-sm font-semibold text-slate-500">No plans are published yet. Please check back soon.</Card>
            ) : null}

            {/* Pricing Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                {plans.map((plan) => (
                    <motion.div
                        key={plan.id || plan.name}
                        layout
                        className={cn(
                            "relative overflow-hidden rounded-[5px] border transition-all",
                            plan.recommended
                                ? "border-brand-400 bg-brand-50/50 shadow-xl shadow-brand-500/10 md:scale-105 md:-my-4"
                                : "border-slate-200 bg-white shadow-sm",
                            plan.isCurrentPlan && "ring-2 ring-brand-600"
                        )}
                    >
                        {plan.recommended && (
                            <div className="absolute top-0 left-0 right-0 bg-brand-600 text-white text-xs font-black uppercase tracking-wider py-1 text-center">
                                Recommended
                            </div>
                        )}

                        <div className={cn("p-6", plan.recommended && "pt-12")}>
                            <h3 className="text-lg font-black text-slate-900">{plan.name}</h3>
                            <p className="mt-1 text-xs font-semibold text-slate-500">{plan.description}</p>

                            <div className="mt-6 flex items-baseline gap-1">
                                <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                                {plan.period && <span className="text-sm font-semibold text-slate-500">{plan.period}</span>}
                            </div>

                            {plan.isCurrentPlan && (
                                <div className="mt-4 inline-block rounded-[3px] bg-brand-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand-700">
                                    Current Plan
                                </div>
                            )}

                            <Button
                                onClick={() => (plan.isCurrentPlan ? setCurrentModalOpen(true) : handlePlanAction(plan.name))}
                                className={cn("w-full mt-6 gap-2", !plan.isCurrentPlan && plan.planType !== "basic" && "bg-brand-600 hover:bg-brand-700")}
                                variant={plan.isCurrentPlan ? "outline" : "primary"}
                                disabled={!plan.isCurrentPlan && plan.planType !== "custom" && paymentProcessing}
                            >
                                {plan.isCurrentPlan ? (
                                    "View Now"
                                ) : plan.planType === "custom" ? (
                                    <>
                                        <Phone size={16} /> {plan.cta}
                                    </>
                                ) : paymentProcessing ? (
                                    "Processing..."
                                ) : (
                                    <>
                                        {plan.cta} <ArrowRight size={16} />
                                    </>
                                )}
                            </Button>

                            <div className="mt-6 space-y-3 border-t border-slate-200 pt-6">
                                <p className="text-xs font-black uppercase tracking-wider text-slate-500">Includes:</p>
                                {plan.features.map((feature: string, i: number) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                                        <span className="text-sm font-semibold text-slate-700">{feature}</span>
                                    </div>
                                ))}

                                {plan.notIncluded.length > 0 && (
                                    <>
                                        <p className="pt-3 text-xs font-black uppercase tracking-wider text-slate-400">Not included:</p>
                                        {plan.notIncluded.map((feature: string, i: number) => (
                                            <div key={i} className="flex items-start gap-2 opacity-50">
                                                <X size={16} className="mt-0.5 shrink-0 text-slate-400" />
                                                <span className="text-sm font-semibold text-slate-500">{feature}</span>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* FAQ Section */}
            <div className="mt-12 space-y-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Frequently Asked Questions</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="p-6 border-slate-200">
                        <h3 className="font-black text-slate-900">Can I switch plans?</h3>
                        <p className="mt-2 text-sm font-semibold text-slate-600">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
                    </Card>
                    <Card className="p-6 border-slate-200">
                        <h3 className="font-black text-slate-900">What payment methods do you accept?</h3>
                        <p className="mt-2 text-sm font-semibold text-slate-600">We accept all major credit cards, bank transfers, and online payment methods.</p>
                    </Card>
                    <Card className="p-6 border-slate-200">
                        <h3 className="font-black text-slate-900">Is there a money-back guarantee?</h3>
                        <p className="mt-2 text-sm font-semibold text-slate-600">Yes, if you're not satisfied, we offer a 30-day money-back guarantee.</p>
                    </Card>
                    <Card className="p-6 border-slate-200">
                        <h3 className="font-black text-slate-900">Do you offer discounts for annual billing?</h3>
                        <p className="mt-2 text-sm font-semibold text-slate-600">Yes, save 20% when you choose annual billing instead of monthly.</p>
                    </Card>
                </div>
            </div>
            <Card className="p-4 border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                WhatsApp/message charges are billed separately from wallet balance where applicable.
            </Card>

            {/* Sales Contact Modal - Only for Enterprise */}
            <SalesContactModal open={selectedPlan !== null} onClose={() => setSelectedPlan(null)} planName={selectedPlan || ""} />

            <AnimatePresence>
                {currentModalOpen ? (
                    <motion.div
                        className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setCurrentModalOpen(false)}
                    >
                        <motion.div
                            className="relative w-full max-w-5xl overflow-hidden rounded-[5px] border border-slate-100 bg-white shadow-2xl"
                            initial={{ y: 20, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 20, opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-brand-600">Current Plan</div>
                                    <h2 className="mt-1 text-lg font-black text-slate-900">{currentDetails?.subscription?.planName || currentPlan?.name || "Active Plan"}</h2>
                                </div>
                                <button onClick={() => setCurrentModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-[5px] transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid gap-4 md:grid-cols-4">
                                    {getUsageCards().map((card: any) => (
                                        <div key={card.key} className="rounded-[5px] border border-slate-200 p-3">
                                            <div className="text-xs font-black uppercase tracking-wider text-slate-500">{card.label}</div>
                                            <div className="mt-2 text-xl font-black text-slate-900">
                                                {Number(card?.data?.used || 0)}{card?.data?.limit == null ? " / ∞" : ` / ${card.data.limit}`}
                                            </div>
                                            <div className="text-xs text-slate-600 mt-1">
                                                Remaining: {card?.data?.remaining == null ? "∞" : card.data.remaining}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="rounded-[5px] border border-slate-200 p-4">
                                        <div className="text-xs font-black uppercase tracking-wider text-slate-500">Validity</div>
                                        <div className="mt-2 text-sm font-semibold text-slate-800">
                                            Start: {currentDetails?.subscription?.currentPeriodStart ? new Date(currentDetails.subscription.currentPeriodStart).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "-"}
                                        </div>
                                        <div className="mt-1 text-sm font-semibold text-slate-800">
                                            End: {currentDetails?.subscription?.currentPeriodEnd ? new Date(currentDetails.subscription.currentPeriodEnd).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "-"}
                                        </div>
                                        <div className="mt-1 text-sm font-semibold text-slate-800">
                                            Status: {currentDetails?.subscription?.status || "-"}
                                        </div>
                                    </div>
                                    <div className="rounded-[5px] border border-slate-200 p-4">
                                        <div className="text-xs font-black uppercase tracking-wider text-slate-500">Enabled Features</div>
                                        <div className="mt-2 space-y-1">
                                            {Object.entries(currentDetails?.subscription?.features || {}).map(([k, v]: any) => (
                                                <div key={k} className="text-sm font-semibold text-slate-700">
                                                    {k}: <span className={v ? "text-emerald-700" : "text-slate-400"}>{v ? "Enabled" : "Disabled"}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}
