# HofAdmin Auth Email Setup

Use `confirm-email.html` for the Supabase Auth confirmation email template.

Recommended Supabase Auth settings for production:

- Site URL: `https://hofadmin.com`
- Redirect URLs:
  - `https://hofadmin.com/auth/callback`
  - `https://hofadmin.com/invite/*`
  - `https://hofadmin.com/invitations/accept`
  - `https://hofadmin.com/*`
- Sender name: `HofAdmin`
- From email: a verified HofAdmin sender such as `noreply@hofadmin.com`
- Confirmation subject: `Welcome to HofAdmin - Confirm your email`

Do not include `localhost` redirect URLs in the production Supabase project. Keep local callback URLs only in a separate local/development project.
