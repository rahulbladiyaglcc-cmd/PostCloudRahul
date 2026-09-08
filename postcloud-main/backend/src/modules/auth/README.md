# Auth Module

Owns login, signup, JWT validation, and role-based route protection.

## Responsibilities

- `AuthController`: public login/signup endpoints and authenticated profile endpoint.
- `AuthService`: verifies passwords and creates JWT responses.
- `AuthGuard`: global bearer-token guard; also rejects inactive users.
- `RolesGuard`: enforces roles declared with `@Roles()`.
- `@Public()`: explicitly bypasses the global auth guard.

## Boundaries

- User persistence and password hashing belong to `UsersService`.
- JWT payloads contain `sub`, `email`, and `role`.
- Do not expose whether an email or password caused a login failure.
- New public endpoints must explicitly use `@Public()`.
