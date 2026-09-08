export class OllamaChatDto {
  systemPrompt: string;
  userContent: string;
  temperature: number;
  format?: 'json';
  unavailableMessage?: string;
}
