import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OllamaChatDto } from '../dto/ollama-chat.dto';

interface OllamaChatResponse {
  message?: {
    content?: string;
  };
}

interface OllamaEmbeddingResponse {
  embeddings?: number[][];
}

@Injectable()
export class OllamaService {
  constructor(private readonly configService: ConfigService) {}

  async chat(request: OllamaChatDto): Promise<string> {
    this.ensureAiEnabled();

    try {
      const response = await fetch(
        `${this.configService.get<string>('config.ollamaBaseUrl')}/api/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.configService.get<string>('config.ollamaModel'),
            stream: false,
            format: request.format,
            options: {
              temperature: request.temperature,
            },
            messages: [
              {
                role: 'system',
                content: request.systemPrompt,
              },
              {
                role: 'user',
                content: request.userContent,
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Ollama responded with ${response.status}`);
      }

      const data = (await response.json()) as OllamaChatResponse;
      return data.message?.content?.trim() ?? '';
    } catch {
      throw new ServiceUnavailableException(
        request.unavailableMessage ??
          'Posta AI Assistant cannot reach Ollama right now.',
      );
    }
  }

  async embed(input: string): Promise<number[]> {
    this.ensureAiEnabled();

    try {
      const response = await fetch(
        `${this.configService.get<string>('config.ollamaBaseUrl')}/api/embed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.configService.get<string>('config.ollamaEmbeddingModel'),
            input,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Ollama responded with ${response.status}`);
      }

      const data = (await response.json()) as OllamaEmbeddingResponse;
      const embedding = data.embeddings?.[0];
      if (!embedding?.length) {
        throw new Error('Ollama returned no embedding');
      }

      return embedding;
    } catch {
      throw new ServiceUnavailableException(
        'Posta AI Assistant cannot generate document embeddings right now.',
      );
    }
  }

  private ensureAiEnabled(): void {
    const aiChatEnabled = this.configService.get<boolean>('config.aiChatEnabled');

    if (!aiChatEnabled) {
      throw new ServiceUnavailableException('Posta AI Assistant is turned off.');
    }
  }
}
