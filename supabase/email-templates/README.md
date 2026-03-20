Use these in the Supabase Auth email template settings:

- `confirm-signup-otp.html`: paste into the `Confirm signup` template.
- `magic-link-sign-in-otp.html`: paste into the `Magic Link` or `Email OTP / sign in` template your project uses.

The app now verifies numeric email OTP codes directly in-app, so both templates prominently render `{{ .Token }}`.
