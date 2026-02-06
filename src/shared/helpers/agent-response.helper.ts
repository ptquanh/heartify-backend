import { AgentChatMessageResponseDTO } from '@modules/agent/dtos/agent-chat-message-response';

export class AgentResponseHelper {
  static parseResponse(rawContent: string): AgentChatMessageResponseDTO {
    let parsed: AgentChatMessageResponseDTO = {
      response: '',
      suggested_actions: [],
    };

    try {
      let cleanJson = rawContent
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const firstBrace = cleanJson.indexOf('{');
      const lastBrace = cleanJson.lastIndexOf('}');

      if (firstBrace >= 0 && lastBrace >= 0) {
        const jsonPart = cleanJson.substring(firstBrace, lastBrace + 1);
        const remainingText = cleanJson.substring(lastBrace + 1).trim();

        parsed = JSON.parse(jsonPart);

        if (remainingText && parsed.response) {
          parsed.response += '\n' + remainingText;
        }

        if (
          parsed &&
          parsed.response &&
          typeof parsed.response === 'string' &&
          parsed.response.trim().startsWith('{')
        ) {
          try {
            const innerParsed = JSON.parse(parsed.response);
            if (innerParsed.response) {
              parsed.response = innerParsed.response;
            }
            if (
              innerParsed.suggested_actions &&
              Array.isArray(innerParsed.suggested_actions) &&
              innerParsed.suggested_actions.length > 0
            ) {
              parsed.suggested_actions = innerParsed.suggested_actions;
            }
          } catch (e) {}
        }
      } else {
        throw new Error('No JSON object found');
      }

      const leakPattern =
        /(\n|\r\n)+\s*(?:\*\*|##|__)?\s*(Suggested Actions|Gợi ý hành động|Next Steps|Follow-up)[:\?]?\s*(?:\*\*|##|__)?[\s\S]*$/i;

      const match = parsed.response.match(leakPattern);

      if (match) {
        const leakedSection = match[0];

        parsed.response = parsed.response.replace(leakedSection, '').trim();

        const currentActionsInvalid =
          !parsed.suggested_actions ||
          parsed.suggested_actions.length === 0 ||
          parsed.suggested_actions.includes('Retry again');

        if (currentActionsInvalid) {
          const extractedActions = leakedSection
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => /^(?:\d+\.|[\-\*])/.test(line))
            .map((line) => {
              return line
                .replace(/^(?:\d+\.|[\-\*])\s*/, '')
                .replace(/\*\*/g, '')
                .trim();
            })
            .filter((line) => line.length > 2 && line.length < 60)
            .slice(0, 3);

          if (extractedActions.length > 0) {
            parsed.suggested_actions = extractedActions as [string, string];
          }
        }
      }

      if (!parsed.suggested_actions || parsed.suggested_actions.length === 0) {
        parsed.suggested_actions = ['More info', 'Other topics?'];
      }

      return parsed;
    } catch (error) {
      let actions: string[] = ['More info', 'Other topics?'];
      let responseText = rawContent.replace(/```/g, '');
      const actionsMatch = rawContent.match(
        /"suggested_actions"\s*:\s*(\[[^\]]*\])/,
      );
      if (actionsMatch) {
        try {
          const parsedActions = JSON.parse(actionsMatch[1]);
          if (Array.isArray(parsedActions) && parsedActions.length > 0) {
            actions = parsedActions;
          }
        } catch (e) {}
      }

      const responseMatch = rawContent.match(
        /"response"\s*:\s*"((?:[^"\\]|\\.)*)"/,
      );

      if (responseMatch) {
        try {
          const safeString = responseMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\"/g, '"');

          if (safeString.trim().length > 0) {
            responseText = safeString;
          }
        } catch (e) {}
      } else {
        const jsonBlockMatch = rawContent.match(
          /\{[\s\S]*"suggested_actions"[\s\S]*\}/,
        );
        if (jsonBlockMatch) {
        }
      }

      if (!responseText || responseText.trim().startsWith('{"')) {
        responseText = rawContent
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();
      }

      return {
        response: responseText,
        suggested_actions: actions as [string, string],
      };
    }
  }
}
