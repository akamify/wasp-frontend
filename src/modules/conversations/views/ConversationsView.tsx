import { useConversationParams } from "@modules/conversations/hooks/useConversationParams";
import { ConversationWorkspace } from "@modules/conversations/views/ConversationWorkspace";

export function ConversationsView() {
  const { urlPhone } = useConversationParams();
  return <ConversationWorkspace controlledPhone={urlPhone} routeBase="/app/conversations" />;
}
