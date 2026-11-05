# Client (React + Vite)

Patterns and checks: [docs/conventions/02-code-style.md](../../docs/conventions/02-code-style.md). Architecture: root [AGENTS.md](../../AGENTS.md).

- All API calls go through `src/services/api.jsx`; new endpoints are added there, never a bare `fetch`. GET errors are in `.error`; POST errors in `.detail || .error`.
- Format currencies and dates only with `src/lib/currencyUtils.js` and `src/lib/dateUtils.js`.
- Navigation stays URL-driven (tab and currency in the path, date range in search params) so views are bookmarkable.

## Glass UI

Tokens live in `src/index.css` (`--glass-bg` 0.82, `--glass-bg-heavy` 0.92, `--glass-border`, `--glass-shadow`, `--glass-shadow-heavy`, `--glass-radius` 20px, `--glass-radius-sm` 14px). Never hardcode opacity.

- Surface: `bg-[var(--glass-bg)] backdrop-blur-2xl border border-[var(--glass-border)] shadow-[var(--glass-shadow)] rounded-[var(--glass-radius)]`. Dialogs use `--glass-bg-heavy` with `backdrop-blur-xl`.
- Floating pill (mobile bar, toasts): `rounded-[22px] bg-[hsl(var(--background)/0.82)] backdrop-blur-2xl border border-[hsl(var(--border))] shadow-2xl`.
- Hover adds depth with shadow only (`hover:shadow-[var(--glass-shadow-heavy)] transition-shadow`), never scale.
- **Safari:** never combine `hover:scale-*` with `backdrop-blur-*` on one element; it breaks the blur in WebKit. Never put `backdrop-blur-*` on `<input>`, `<select>` or `<textarea>`; blur the wrapper.
- Active/selected: `bg-[hsl(var(--accent)/0.1)] text-[hsl(var(--accent))]`. Disabled: `opacity-40 pointer-events-none`. Income `--positive`, expenses `--destructive`.
- Sidebar: `w-14 px-2` collapsed (icon only, centered), `w-56 px-4` expanded.
