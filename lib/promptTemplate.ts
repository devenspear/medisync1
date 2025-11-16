// These imports are only used server-side
// import { readFileSync } from 'fs';
// import { join } from 'path';

export interface PromptVariables {
  Wisdom_Source_Name: string;
  Wisdom_Snippet: string;
  User_Primer: string;
  User_Goal: string;
  User_Feelings_List: string;
  Max_Word_Count: number;
}

// Import constants from separate file to avoid bundling server-side code in client
export {
  WISDOM_SOURCES,
  FEELING_OPTIONS,
  GOAL_OPTIONS,
  type WisdomSource,
  type FeelingOption,
  type GoalOption
} from './promptConstants';

export class PromptTemplateManager {
  private templateCache: string | null = null;

  /**
   * Load the master prompt template from the markdown file (server-side only)
   */
  private async loadTemplate(): Promise<string> {
    if (this.templateCache) {
      return this.templateCache;
    }

    try {
      // Dynamic import for server-side modules
      const { readFileSync } = await import('fs');
      const { join } = await import('path');

      const templatePath = join(process.cwd(), 'MediSync_MasterPrompt_250914.md');
      const template = readFileSync(templatePath, 'utf-8');

      // Extract the prompt content between **[START OF PROMPT]** and **[END OF PROMPT]**
      const startMarker = '**[START OF PROMPT]**';
      const endMarker = '**[END OF PROMPT]**';

      const startIndex = template.indexOf(startMarker);
      const endIndex = template.indexOf(endMarker);

      if (startIndex === -1 || endIndex === -1) {
        throw new Error('Could not find prompt markers in template file');
      }

      const promptContent = template.substring(startIndex + startMarker.length, endIndex).trim();
      this.templateCache = promptContent;
      return promptContent;
    } catch (error) {
      console.error('Failed to load prompt template:', error);
      // Return a fallback template
      return this.getFallbackTemplate();
    }
  }

  /**
   * Get wisdom snippet for a given source
   */
  getWisdomSnippet(wisdomSourceName: string): string {
    const { WISDOM_SOURCES } = require('./promptConstants');
    const source = WISDOM_SOURCES.find((s: any) => s.internalKeyword === wisdomSourceName);
    return source?.conceptSnippet || WISDOM_SOURCES[0].conceptSnippet; // Default to Universal
  }

  /**
   * Generate the final prompt by replacing variables in the template
   */
  async generatePrompt(variables: PromptVariables): Promise<string> {
    const template = await this.loadTemplate();

    let prompt = template;

    // Replace all template variables
    prompt = prompt.replace(/\{\{Wisdom_Source_Name\}\}/g, variables.Wisdom_Source_Name);
    prompt = prompt.replace(/\{\{Wisdom_Snippet\}\}/g, variables.Wisdom_Snippet);
    prompt = prompt.replace(/\{\{User_Primer\}\}/g, variables.User_Primer || 'No specific primer provided');
    prompt = prompt.replace(/\{\{User_Goal\}\}/g, variables.User_Goal);
    prompt = prompt.replace(/\{\{User_Feelings_List\}\}/g, variables.User_Feelings_List || 'None specified');
    prompt = prompt.replace(/\{\{Max_Word_Count\}\}/g, variables.Max_Word_Count.toString());

    return prompt;
  }

  /**
   * Calculate word count based on duration accounting for SSML pauses
   */
  calculateMaxWordCount(durationMinutes: number): number {
    // Use 80 words per minute to account for:
    // - Slow meditation speaking pace
    // - SSML pause tags (1.5s after periods, 0.8s after commas)
    // - Natural breathing room
    // This ensures the narration fits within the requested duration
    return Math.floor(durationMinutes * 80);
  }

  /**
   * Fallback template if file loading fails
   */
  private getFallbackTemplate(): string {
    return `
You are a master spiritual guide and meditation scriptwriter. Create a beautiful, flowing guided meditation script based on the following inputs:

**Wisdom Source:** {{Wisdom_Source_Name}}
**Core Concept:** {{Wisdom_Snippet}}
**User's Primer:** {{User_Primer}}
**Primary Goal:** {{User_Goal}}
**Feelings to Transform:** {{User_Feelings_List}}

**Requirements:**
- Maximum {{Max_Word_Count}} words
- 100% positive and empowering language
- Present tense, second person ("You are...")
- Include simple audio cues like [Pause] sparingly
- Structure: 15% induction, 60% core message, 25% integration
- Start with a beautiful title for the meditation

Create the complete meditation script now.
    `;
  }

  /**
   * Validate that the template file exists and is readable
   */
  async validateTemplate(): Promise<{ isValid: boolean; error?: string }> {
    try {
      await this.loadTemplate();
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const promptTemplateManager = new PromptTemplateManager();