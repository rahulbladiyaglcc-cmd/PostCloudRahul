# AI Chat

Public entry point for Posta Mitra at `POST /api/ai-chat/message`.

- `AiChatController` validates the request DTO and hands it off.
- `AiChatService` asks for an intent, normalizes untrusted output, and routes by `AiChatIntent`.
- Keep business logic in the routed service, not in this folder.
- Unsupported or malformed intents must return the supported-actions response.
