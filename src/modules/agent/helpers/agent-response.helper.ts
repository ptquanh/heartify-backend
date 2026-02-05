import { AgentChatMessageResponseDTO } from '../dtos/agent-chat-message-response';

export class AgentResponseHelper {
  static parseResponse(responseContent: string): AgentChatMessageResponseDTO {
    try {
      const jsonMatch = responseContent.match(/```json([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1].trim());
      }

      const firstOpenBrace = responseContent.indexOf('{');
      const lastCloseBrace = responseContent.lastIndexOf('}');

      if (
        firstOpenBrace !== -1 &&
        lastCloseBrace !== -1 &&
        lastCloseBrace > firstOpenBrace
      ) {
        const jsonString = responseContent.substring(
          firstOpenBrace,
          lastCloseBrace + 1,
        );
        return JSON.parse(jsonString);
      }

      const cleanedResponse = responseContent
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      throw new Error(`Failed to parse agent response: ${error.message}`);
    }
  }
}
