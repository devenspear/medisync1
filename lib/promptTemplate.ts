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

export interface WisdomSource {
  displayName: string;
  internalKeyword: string;
  conceptSnippet: string;
}

export interface FeelingOption {
  feeling: string;
  antidoteThemes: string;
}

export interface GoalOption {
  goal: string;
  coreFocus: string;
}

// Wisdom Sources from the master prompt
export const WISDOM_SOURCES: WisdomSource[] = [
  {
    displayName: "Universal Wisdom",
    internalKeyword: "Default/Universal",
    conceptSnippet: "The creative power of consciousness and the principle of oneness."
  },
  {
    displayName: "The Teachings of Jesus",
    internalKeyword: "Christianity",
    conceptSnippet: "The Kingdom of God is within you; the power of unwavering faith."
  },
  {
    displayName: "The Teachings of Buddha",
    internalKeyword: "Buddhism",
    conceptSnippet: "The mind is the source of all things; freedom comes from releasing attachment."
  },
  {
    displayName: "The Wisdom of the Tao",
    internalKeyword: "Taoism",
    conceptSnippet: "The power of effortless action (Wu Wei) and living in harmony with the natural flow."
  },
  {
    displayName: "The Hermetic Principles",
    internalKeyword: "Hermeticism",
    conceptSnippet: "The All is Mind; your reality corresponds to your thoughts and vibrations."
  },
  {
    displayName: "New Thought Masters",
    internalKeyword: "New Thought",
    conceptSnippet: "Your imagination creates reality; feel the wish fulfilled to manifest it."
  }
];

// Feelings to Transcend (checkboxes)
export const FEELING_OPTIONS: FeelingOption[] = [
  { feeling: "Anxiety", antidoteThemes: "Calm, Serenity, Trust, Safety" },
  { feeling: "Fear", antidoteThemes: "Courage, Security, Inner Strength, Faith" },
  { feeling: "Doubt", antidoteThemes: "Certainty, Confidence, Knowing, Trust" },
  { feeling: "Overwhelm", antidoteThemes: "Clarity, Simplicity, Focus, Peace" },
  { feeling: "Sadness", antidoteThemes: "Joy, Lightness, Hope, Inner Warmth" },
  { feeling: "Anger/Frustration", antidoteThemes: "Peace, Forgiveness, Release, Understanding" },
  { feeling: "Loneliness", antidoteThemes: "Oneness, Connection, Inner Love, Wholeness" },
  { feeling: "Guilt/Shame", antidoteThemes: "Self-Forgiveness, Acceptance, Freedom, Worthiness" },
  { feeling: "Confusion", antidoteThemes: "Clarity, Wisdom, Inner Guidance, Knowing" },
  { feeling: "Unworthiness", antidoteThemes: "Self-Love, Divine Value, Perfection, Acceptance" }
];

// Primary Goals (single choice)
export const GOAL_OPTIONS: GoalOption[] = [
  { goal: "Inner Peace & Calm", coreFocus: "Cultivating a state of deep tranquility and releasing internal noise." },
  { goal: "Clarity & Focus", coreFocus: "Quieting the mind to receive inner guidance and clear direction." },
  { goal: "Confidence & Self-Worth", coreFocus: "Awakening the user's awareness of their inherent power and divine value." },
  { goal: "Abundance & Prosperity", coreFocus: "Aligning the user's mindset with feelings of wealth, flow, and receiving." },
  { goal: "Healing & Well-Being", coreFocus: "Directing awareness to the body's innate perfection and vitality." },
  { goal: "Letting Go & Release", coreFocus: "Freeing the user from past attachments and embracing the present moment." },
  { goal: "Creativity & Flow", coreFocus: "Opening the channel to effortless inspiration and creative energy." },
  { goal: "Love & Connection", coreFocus: "Cultivating feelings of self-love and recognizing oneness with all life." }
];

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
    const source = WISDOM_SOURCES.find(s => s.internalKeyword === wisdomSourceName);
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
   * Calculate word count based on duration (approximately 120-150 words per minute for meditation)
   */
  calculateMaxWordCount(durationMinutes: number): number {
    // Use 130 words per minute as average for meditation scripts
    return Math.floor(durationMinutes * 130);
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