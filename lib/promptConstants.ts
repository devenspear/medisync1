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