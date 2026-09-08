# Users Module

Owns user persistence and the default administrator account.

## Responsibilities

- `UsersController`: user CRUD endpoints.
- `UsersService`: user lookup, persistence, and default admin initialization.
- `User`: account entity and password serialization behavior.
- `UserRole`: supported authorization roles.

## Boundaries

- Authentication and JWT creation belong to the auth module.
- `UsersService` is exported because auth guards and login depend on it.
- Password hashing is handled by the user entity lifecycle; never return password fields.
- Default admin credentials come from environment configuration and must be changed outside development.
