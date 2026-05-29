# UI Design Rules (App-in-Toss)

## TDS Design Principles
- TDS components have perfect built-in styles — no additional CSS needed
- Custom CSS is allowed ONLY for layouts TDS doesn't provide (flex, grid containers)
- Adding margin/padding to TDS components breaks the UI — NEVER do this
- Spacing: use TDS Spacing component only (size prop required) — ListRow has NO padding prop

## Mobile UX Requirements
- Touch targets: minimum 44px (TDS components meet this by default)
- Korean as default UI language (Toss user base)
- Loading: TDS Skeleton or spinner
- Error: error message + retry button (TDS Button)
- Empty: icon + description + CTA (TDS Button)
- Scroll: natural overscroll, consider pull-to-refresh patterns

## Colors & Dark Mode
- Toss brand primary: handled by TDS theme — NEVER hardcode #3182F6 or any HEX value
- TDS components apply appropriate colors automatically — NEVER hardcode hex values
- Use TDS semantic color tokens only: var(--tds-color-background), var(--tds-color-grey50), etc.
- Dark mode users are 상당수 — hardcoded white/black backgrounds BREAK dark mode
- No external font loading (Toss Products Sans auto-applied)
