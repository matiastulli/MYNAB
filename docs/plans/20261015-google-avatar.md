-----
Status: #IN_PROGRESS — implemented on main, pending commit and deploy
-----

# Profile picture from Google instead of uploads

## Goal

Stop storing user-uploaded profile pictures in Postgres. Show the picture from the user's Google account instead.

## Why

- `auth_user.avatar_data` holds base64 JPEGs (up to 10 MB each) in a hot table, so every profile read moves the image bytes.
- Sign-in is Google-only, and Google's `userinfo` response already includes a `picture` URL.

## Changes

| Layer | Change |
|---|---|
| db | Migration: add `auth_user.avatar_url` (varchar 2048, nullable), drop `avatar_data`. Both databases have 0 users, so no pictures are lost |
| service | `google_sign_in` stores `picture` (https only) on create, on email match, and on every sign-in, because Google rotates these URLs |
| service | Remove `PUT /auth/avatar`, `UpdateAvatar`, `update_avatar()`. `UserResponse.avatar_data` becomes `avatar_url` |
| client | `Avatar` renders `avatar_url` (`referrerPolicy="no-referrer"`, falls back to initials on load error). Upload UI removed from `ProfileDialog` |
| docs | README ER diagram; privacy policy mentions the profile picture URL |

## Deploy order

The service ships before or together with the client: the client reads `avatar_url`, and an old service only returns `avatar_data`. Both live in the same repo and deploy from `main`, so the migration runs through `entrypoint.sh`.

## Acceptance

- [x] `alembic upgrade head` and `alembic downgrade -1` both apply cleanly on `mynab_dev`
- [x] Signing in stores the Google picture URL (verified on `mynab_dev`); the sidebar, mobile bar and profile dialog show it
- [ ] Accounts without a picture, or whose image fails to load, show initials (implemented, not exercised in a browser)
- [x] `PUT /auth/avatar` returns 404
- [x] Service unit tests pass (20, incl. `test_auth_avatar.py`), client lint and build pass
