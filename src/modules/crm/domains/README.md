# CRM Frontend Domain Plan

This is a non-breaking UI domain scaffold for planned CRM expansion.
Existing pages/components/hooks/services remain active and unchanged.

Planned UI domain split:
- `dashboard/`: CRM overview and KPI cards.
- `leads/`: lead board/list/search/filter UX.
- `employees/`: employee management screens.
- `conversations/`: conversation container and shared states.
- `inbox/`: message timeline/composer/reply actions.
- `settings/`: workspace CRM settings.
- `analytics/`: charts/trends/agent performance.
- `profile/`: employee profile/security UX.
- `auth/`: employee login/session helpers.

Rule: migrate feature-by-feature without changing existing route behavior.
