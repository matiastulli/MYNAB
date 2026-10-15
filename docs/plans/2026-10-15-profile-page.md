-----
Status: #IN_PROGRESS — on main: /profile route replaces ProfileDialog, plus server-side sign-out
-----

# Profile page instead of profile modal

## Goal

Replace the profile modal with a page at `/profile`, where the user edits their profile and account settings. It must work at phone width and return the user to the tab, currency and date range they came from.

## Scope

- New route `/profile` that does everything the dialog does today (inventory below).
- The three places that open the dialog now go to the page instead.
- A shared `useProfile` hook, so the page doesn't have to mount `useDashboardData`.
- Fix the two cases where saving fails (empty CUIT, empty last name). This is client-only, inside the form being moved.
- Server-side sign-out (Juan's call to fold it in). Today `api.logout()` only clears `localStorage` and never calls `DELETE /auth/logout`, so the refresh token stays valid on the server and the cookie stays in the browser.

## Out of scope

- Any backend change beyond the logout cookie fix in Task 4b. `GET /auth/profile` and `PUT /auth/profile` are enough. No migration.
- Delete account, data export, editing email, avatar upload (removed on purpose in `2026-10-15-google-avatar.md`). Each needs its own plan.
- Clearing the TanStack Query cache on sign-out (pre-existing).
- A warning on unsaved changes when leaving the page. `useBlocker` needs a data router, and the app uses `<BrowserRouter>`.
- Deleting `components/ui/dialog.jsx`. ProfileDialog is its only user today, but it is a shared primitive, so it stays.

## Inventory of the current dialog (`components/auth_user/ProfileDialog.jsx`)

| Area | What it does today | On the page |
|---|---|---|
| Identity header | `Avatar` (Google `avatar_url`, initials if missing), name + last name (falls back to "Your profile"), email (falls back to "Profile settings") | Keep |
| First name | Required, placeholder "Valentina" | Keep. Add `minLength={2}` to match the backend |
| Last name | Placeholder "Echeverría". Optional in the UI, but the backend requires 2+ characters | Make it required with `minLength={2}` to match `UpdateUser` |
| CUIT (`national_id`) | Strips non-digits, `inputMode="numeric"`, `figure` class, warning icon and warning-colored hint when empty, hint about skipped transfers | Keep. Send `null` when empty (see Task 2) |
| Save | `PUT /auth/profile` with `{name, last_name, national_id}`, button shows "Saving", error text "Your changes could not be saved. Try again.", success panel "Profile saved", then refreshes `["profile"]` and closes after 1.5 s | Keep the request and the error text. Show success inline and stay on the page (no auto-close) |
| Appearance | Light / Dark / Auto `Segmented` via `setTheme`, kept in sync through the `themechange` event | Keep as is |
| Sign out | Closes the dialog, then after 300 ms calls `MainApp.handleLogout` (`api.logout()` + App's `onLogout`, which redirects to `/`) | Call App's `onLogout` directly, no delay |
| Close (X) / no autofocus on open | Dialog behavior | Replaced by a back button. Autofocus only when arriving from the CUIT banner |

Things the dialog does **not** do: delete account, change email, export data.

Places that open the dialog (all in `MainApp.jsx`):

1. Desktop sidebar user button (~line 239)
2. Mobile bottom bar avatar (~line 283)
3. "Add your CUIT" warning banner in the page header (~line 376)

## Route and layout decision

> **Superseded (Juan, 2026-10-15):** the profile must keep the app shell (desktop sidebar, mobile header/bottom bar). Built as: MainApp is a layout route (`<Outlet>`) shared by `/dashboard/*` and `/profile`. On `/profile`, MainApp feeds `useDashboardData` the tab, currency and range from `location.state.from`, so the hook never rewrites the URL, and an `isProfileRef` keeps the popstate/exit-toast logic out of the way. The standalone reasoning below is kept for history.

**`/profile` as its own protected route next to the dashboard routes, not inside the MainApp shell.** It is lazy-loaded inside `ProtectedRoute` and has its own simple top bar.

Why:

- **No clash with `:tab`.** `/dashboard/profile` would put `profile` into `params.tab`. `useDashboardData` would then set `activeTab = "profile"` and its URL rewriting (`navigate(..., {replace:true})` on any filter change) would apply to the profile page.
- **Android back button works with no extra code.** MainApp's `popstate` handler (the home / exit-toast logic) is unmounted on `/profile`, so the hardware back button just goes back to the previous dashboard URL.
- **The shell's controls don't belong here.** The sidebar and mobile bottom bar mostly hold `CurrencyFilter` and the date filter. On a phone, a full-screen page with a back arrow is the normal pattern.
- **Smallest diff.** Wrapping MainApp's ~500 lines in a layout route with `<Outlet>` is a bigger refactor than this goal needs.
- Cost: on desktop the sidebar disappears while on `/profile`.

**Getting back:** entry points navigate with `state: { from: pathname + search }`. The page's back button calls `navigate(-1)` when `location.state?.from` is set. Otherwise (direct load, bookmark, refresh) it calls `navigate("/dashboard", { replace: true })`. Tab, currency and date range all live in the URL, so going back restores them. Pagination offset is not in the URL and resets, as it does on any reload.

**Layout:** sticky top bar with `env(safe-area-inset-top)` like MainApp's mobile header, a back arrow and a "Profile" title. Below that, a single centered column (`max-w-xl`, `px-4` on mobile), in this order: identity header → profile form card → appearance → sign out. The bottom gets `env(safe-area-inset-bottom)` padding for the Android app (TWA). Styling follows the existing card and border tokens; `PrivacyPolicy.jsx` is the reference for a standalone page with a back link.

## Tasks

Branch: none. Juan asked for this work to go directly on `main`.

1. **[engineer] Extract the profile query into `app/client/src/hooks/useProfile.js`**
   - `useProfile()` returns `useQuery({ queryKey: ["profile"], queryFn: () => GET /auth/profile, staleTime: 5 min, retry: 1 })`, the same options `useDashboardData.js` uses now.
   - `useUpdateProfile()` returns `useMutation`. It calls `api.put("/auth/profile", payload)`, throws when `response.error` is set, and on success writes the returned `UserResponse` into the cache with `setQueryData(["profile"], data)`.
   - `useDashboardData.js` uses `useProfile()` instead of its own query. It still returns `userData`. Remove `fetchProfile` and, once MainApp no longer needs it, `fetchUserProfile`.
   - Done when: the `["profile"]` key is defined in exactly one place, and the dashboard still shows the avatar, name and CUIT warning.

2. **[engineer] Create `app/client/src/components/auth_user/ProfilePage.jsx`** (depends on 1)
   - Port everything in the inventory. Props: `{ onLogout }`.
   - Show a skeleton until `useProfile()` has data. Then render the form as a child component with `key={userData.id}`, initialized **once** with `useState(() => …)`. Do not copy ProfileDialog's `useEffect([userData])` re-sync: a background refetch would erase what the user is typing.
   - Payload: `{ name, last_name, national_id: national_id || null }`. Empty CUIT must save as `null`, not `""`. The backend schema accepts `null`; an empty string gets a 422.
   - Inline success ("Profile saved") without leaving the page. Disable Save while saving. Error text stays the same.
   - Back button and fallback exactly as in the route decision.
   - If `location.state?.focus === "national_id"`, focus the CUIT input on mount.
   - Sign out calls `onLogout()`.
   - Use Phosphor `*Icon` exports, motion from `lib/motion.js`, color tokens only, and no `hover:scale` together with `backdrop-blur` on the same element.
   - Done when: every row of the inventory works at 360 px and at desktop width, in light and dark.

3. **[engineer] Add the route in `app/client/src/App.jsx`** (can run in parallel with 2)
   - `const ProfilePage = React.lazy(() => import('@/components/auth_user/ProfilePage'))`.
   - `<Route path="/profile" element={<ProtectedRoute …><ProfilePage onLogout={handleLogout} /></ProtectedRoute>} />` above the `*` route.
   - The current `dashboardSpinner` fallback draws a sidebar skeleton. Use a plain centered fallback for this route (`ProtectedRoute` can take an optional `fallback` prop).
   - Done when: `/profile` while signed out redirects to `/`, and while signed in it renders the page, including on a hard refresh.

4. **[engineer] Change MainApp to navigate to the page** (`app/client/src/components/MainApp.jsx`, depends on 3)
   - Remove the `ProfileDialog` import and render, the `showProfileModal` state, and `handleLogout`, which only the dialog used.
   - In App.jsx, drop the now-unused `onLogout` prop from `<MainApp>`.
   - Make the three entry points `<Link to="/profile" state={{ from: location.pathname + location.search }}>` (via `useLocation`), keeping their current classes. The CUIT banner also passes `focus: "national_id"`.
   - Done when: no `setShowProfileModal` remains, and each entry point opens `/profile`. Back returns to the same tab, currency and date range.

4b. **[engineer] Server-side sign-out**
   - Client (`services/api.jsx`): `api.logout()` becomes async. It calls `DELETE /auth/logout` with credentials (so the `refreshToken` cookie is sent), ignores any error or 401 (signing out must never fail for the user), then clears `localStorage` as today. Do not route this call through the 401 → refresh retry. Every caller (App's `handleLogout`, the profile page) awaits it before redirecting.
   - Service (`auth_user/router.py`, `logout_user`): it calls `response.delete_cookie(...)` on the injected `Response` but then returns a new `JSONResponse`, so FastAPI drops that `Set-Cookie` header and the browser keeps the cookie. Set the expired cookie on the response that is actually returned. The server-side `expire_refresh_token` already works. Run the service checks from `docs/conventions/02-code-style.md` afterwards.
   - Done when: after signing out, the `refreshToken` cookie is gone from the browser, and replaying the old cookie against `POST /auth/refresh` is rejected.

5. **[engineer] Clean up**
   - Delete `app/client/src/components/auth_user/ProfileDialog.jsx`.
   - In `CLAUDE.md` § Frontend Routing, add one line saying `/profile` is a protected standalone route.
   - Run `cd app/client && npm run lint && npm run build`, plus the service checks for the `router.py` change, and report the results.

6. **[QA] Validate.** No client test suite exists, so this is manual, in a browser at 360 px and at desktop width.
   - Every inventory row, in light and dark.
   - The high-risk checks below.

## High-risk things to test

- **Save with empty fields.** A user with no CUIT edits only their first name and saves; it must succeed and leave CUIT `null`. Clearing an existing CUIT must also save.
- **Single-name Google account.** If `last_name` is `""`, the form must block submit with a visible required-field message, not a generic save error.
- **Edits survive a background refetch.** Type in the form, switch away for 5+ minutes, come back: the typed text must still be there.
- **Getting back from the page.** From `/dashboard/entries?currency=ARS&startDate=…&endDate=…&preset=…`, open the profile from each of the 3 entry points, then go back with the in-page arrow, the browser back button, and the Android hardware back button. Each must land on the same URL, with no exit toast.
- **Direct load.** Open `/profile` in a new tab: the back arrow goes to `/dashboard` and doesn't leave the app.
- **Sign out from the page** lands on `/`, and `/profile` then redirects to `/`. The `refreshToken` cookie is gone, and the old token is rejected by `POST /auth/refresh`.
- **Sign out with the API down or the cookie already gone** still signs the user out locally.
