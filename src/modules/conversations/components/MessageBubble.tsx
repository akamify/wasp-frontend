import type { ReactNode } from "react";
import type { ChatMessage } from "@modules/conversations/types/conversations.types";
import { formatChatTime } from "@modules/conversations/utils/timeFormat";
import { cn } from "@shared/utils/cn";
import { isMetaBillingEligibilityPaymentIssue } from "@shared/utils/metaErrors";

type Props = {
  message: ChatMessage;
  children: ReactNode;
  getErrorMessage: (error: any) => string;
  renderMetaBillingGuidance: (error: any) => ReactNode;
  statusMark: (message: ChatMessage) => ReactNode;
};

export function MessageBubble({ message, children, getErrorMessage, renderMetaBillingGuidance, statusMark }: Props) {
  return (
    <div className={cn("flex w-full min-w-0", message.direction === "outbound" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "relative max-w-[calc(100%-2rem)] sm:max-w-[75%] w-fit min-w-0 p-3.5 text-ink-900 shadow-sm transition-all rounded-[5px] overflow-visible",
          message.direction === "outbound" ? "bubble-outbound rounded-tr-none bg-white shadow-md" : "bubble-inbound rounded-tl-none bg-[#e1ffc7]"
        )}
      >
        <div className="relative min-w-[70px] max-w-full">
          {children}
          <div className="flex items-center justify-end gap-0.5 mt-0.5">
            <span className={cn("text-[9.5px] font-bold uppercase tracking-wider", message.direction === "outbound" ? "text-ink-900/50" : "text-ink-800/40")}>
              {formatChatTime(message.createdAt)}
            </span>
            {message.direction === "outbound" ? statusMark(message) : null}
          </div>
        </div>
        {message.direction === "outbound" && message.status === "failed" && message.error && (
          <div className="mt-3 max-w-[360px] border-t border-ink-900/10 pt-3 text-[10px] font-bold text-rose-600 [overflow-wrap:anywhere]">
            {isMetaBillingEligibilityPaymentIssue(getErrorMessage(message.error)) ? renderMetaBillingGuidance(message.error) : getErrorMessage(message.error)}
          </div>
        )}
      </div>
    </div>
  );
}
