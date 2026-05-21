# Conversations Module

Owns the Inbox / Conversations feature:

- Conversation list + filtering
- Message fetching + rendering
- Read/clear actions
- Contact side panel + edits
- Composer (text + media)

Non-breaking constraints:
- Routes remain defined in `src/App.tsx`
- API client remains `src/api/api.js`
- This module only reorganizes code; behavior/UI must remain identical
