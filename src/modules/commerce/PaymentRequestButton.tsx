import { useRef, useState } from "react";
import { Button } from "@components/ui/Button";
import { useCommerce, useCommerceAction } from "./commerceContext";
import type { Attempt } from "./types";
import { ErrorNotice, label } from "./ui";

export default function PaymentRequestButton({ attempt, to, onSent }: { attempt: Attempt; to: string; onSent: () => void }) {
  const { can } = useCommerce(), action = useCommerceAction();
  const intent = useRef<string | null>(null), lock = useRef(false);
  const [notice, setNotice] = useState("");
  if (attempt.mode === "whatsapp_native") return <p className="text-sm">Native WhatsApp request: {label(attempt.status)}. Native checkout includes a Review and Pay send attempt; inspect its delivery in the customer inbox.</p>;
  if (!attempt.paymentUrl || !can("commerce.messages.send") || !can("inbox.reply") || !can("commerce.payments.view")) return null;
  return <div className="space-y-2"><Button size="sm" variant="outline" disabled={action.busy || !!notice} onClick={() => {
    if (lock.current) return; lock.current = true;
    if (!intent.current) intent.current = crypto.randomUUID();
    setNotice("Delivery is being checked. Inspect the customer inbox before sending again.");
    void action.run<{ message: { status: string } }>("/messages", { kind: "payment_request", attemptId: attempt.id, to, idempotencyKey: intent.current }, (result) => {
      setNotice(result.message.status === "unknown" ? "Delivery is unknown. Inspect the customer inbox before sending again." : "Payment request submitted to WhatsApp.");
      onSent();
    });
  }}>Send payment request on WhatsApp</Button><ErrorNotice message={action.error} />{notice && <p role="status" className="text-sm">{notice}</p>}</div>;
}
