# Authentication Feature Boundary

- **Feature Name**: Login and role-based access
- **Assigned Team Member**: Member 1
- **Status**: Implemented — JWT login, role-based web routes, forgot/reset password, and email verification flows.
- **Description**: Handles secure authentication, token management, and role-based access verification for Backoffice users and Grid Operators via the C# Web API.

## Pages

| Route | Purpose |
|---|---|
| `/login` | Username/password login; redirects Backoffice → Admin Settings, Grid Operator → Energy Slots |
| `/reset-password` | Complete password reset with emailed token |
| `/verify-email` | Confirm email verification token |

## Notes

- Passwords are hashed with BCrypt in the API (legacy plaintext values are upgraded on next successful login).
- SMTP settings for forgot-password / verification emails are configured on the Server (`Email__*` / `appsettings` Email section).
