export interface AssessmentData {
  goal: string
  currentState: string
  duration: number
  experience: string
  timeOfDay: string
  challenges?: string
  meditationStyle?: string
  environment?: string
}

export interface MeditationScript {
  intro_text: string
  main_content: string
  closing_text: string
  total_words: number
  estimated_duration: number
}

export class ScriptGenerator {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateScript(assessment: AssessmentData, promptPrimer?: string): Promise<MeditationScript> {
    const prompt = this.constructPrompt(assessment, promptPrimer)

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert meditation guide creating personalized, calming meditation scripts. Always speak in second person (you, your). Use gentle, soothing language. Include specific breathing instructions and visualization techniques.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const generatedText = data.choices[0].message.content

      return this.parseScript(generatedText, assessment.duration)

    } catch (error) {
      console.error('Script generation failed:', error)
      console.log('Using fallback script generation...')
      return this.getFallbackScript(assessment)
    }
  }

  private constructPrompt(assessment: AssessmentData, promptPrimer?: string): string {
    const affirmationCount = Math.floor(assessment.duration / 3) // Roughly one affirmation every 3 minutes

    let basePrompt = `Create a ${assessment.duration}-minute meditation script for someone who:
- Goal: ${assessment.goal}
- Current state: ${assessment.currentState}
- Experience level: ${assessment.experience}
- Environment: ${assessment.environment || 'quiet space'}`

    if (promptPrimer && promptPrimer.trim()) {
      basePrompt += `\n- Additional customization: ${promptPrimer.trim()}`
    }

    basePrompt += `

STRUCTURE REQUIRED:
1. INTRO (30-45 seconds): Welcome and initial breathing guidance
2. MAIN CONTENT (${assessment.duration - 1} minutes): Include ${affirmationCount} positive affirmations related to ${assessment.goal}, breathing techniques, and appropriate visualization
3. CLOSING (30 seconds): Gentle return to awareness

REQUIREMENTS:
- Use second person (you, your)
- Speak slowly and calmly
- Include specific breath counts (inhale for 4, hold for 4, exhale for 6)
- Make affirmations relevant to ${assessment.goal}
- Consider they are feeling ${assessment.currentState}
- Match complexity to ${assessment.experience} level
- Adapt to their ${assessment.environment || 'quiet'} environment`

    if (promptPrimer && promptPrimer.trim()) {
      basePrompt += `\n- Incorporate the custom instructions: ${promptPrimer.trim()}`
    }

    basePrompt += `

FORMAT: Return the script in three clear sections marked as:
INTRO:
[intro text here]

MAIN:
[main content here]

CLOSING:
[closing text here]`

    return basePrompt
  }

  private parseScript(text: string, duration: number): MeditationScript {
    const sections = text.split(/(?:INTRO:|MAIN:|CLOSING:)/).map(s => s.trim()).filter(Boolean)

    let intro = ''
    let main = ''
    let closing = ''

    if (sections.length >= 3) {
      intro = sections[0]
      main = sections[1]
      closing = sections[2]
    } else {
      // Fallback parsing if format isn't followed
      const paragraphs = text.split('\n\n').filter(p => p.trim())
      intro = paragraphs[0] || ''
      main = paragraphs.slice(1, -1).join('\n\n') || ''
      closing = paragraphs[paragraphs.length - 1] || ''
    }

    const totalWords = this.countWords(intro + main + closing)

    return {
      intro_text: intro,
      main_content: main,
      closing_text: closing,
      total_words: totalWords,
      estimated_duration: duration
    }
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length
  }

  private getFallbackScript(assessment: AssessmentData): MeditationScript {
    const scripts = {
      relaxation: {
        intro: "Welcome to your relaxation session. Find a comfortable position and close your eyes gently. Take a deep breath in through your nose for 4 counts... hold for 4... and release slowly through your mouth for 6 counts. Let your body begin to unwind.",
        main: "Continue with this breathing rhythm. With each exhale, feel tension melting away from your shoulders... your arms... your entire body. You are safe and at peace. Visualize yourself in a calm, peaceful place where you feel completely relaxed. You deserve this time to restore your inner calm. Your breath is your anchor to tranquility.",
        closing: "Begin to bring your awareness back to the present moment. Wiggle your fingers and toes gently. Take three deep breaths and open your eyes when you're ready. You are refreshed and at peace."
      },
      focus: {
        intro: "Welcome to your focus session. Sit comfortably with your spine straight. Close your eyes and take a centering breath. Inhale clarity for 4 counts... hold for 4... exhale distractions for 6 counts. Your mind is becoming clear and focused.",
        main: "With each breath, your concentration grows stronger. You have the power to direct your attention exactly where you choose. Visualize your mind as a clear, still lake. Any scattered thoughts are like ripples that naturally settle. You are capable of deep focus. Your mental clarity is sharp and unwavering.",
        closing: "Feel this sense of mental clarity settling into your awareness. You carry this focused energy with you. Take three energizing breaths and gently open your eyes, ready to engage with renewed focus."
      },
      sleep: {
        intro: "Welcome to your sleep preparation session. Lie down comfortably and let your eyes close naturally. Take a slow, deep breath in for 4 counts... hold gently for 4... and release completely for 6 counts. Feel your body sinking deeper into rest.",
        main: "With each breath, you're drifting further into peaceful relaxation. Your body is heavy and warm. Starting from your toes, feel each part of your body releasing into sleep. You are safe and protected. Tomorrow will take care of itself. Right now, there is only peace and rest. Your breathing is becoming slower and deeper.",
        closing: "Allow yourself to drift naturally into peaceful sleep. There's nothing you need to do now except rest. Sweet dreams await you."
      },
      anxiety: {
        intro: "Welcome to your anxiety relief session. Find a safe, comfortable position and gently close your eyes. Take a slow breath in for 4 counts... hold for 4... and release for 6 counts. You are safe in this moment.",
        main: "Continue this calming breath. Notice that anxiety is temporary - it rises and falls like waves. You are the steady shore, unshaken by these waves. With each breath, feel your nervous system settling. You have survived difficult moments before, and you will navigate this one too. You are stronger than your anxiety.",
        closing: "Feel your breath returning to its natural rhythm. You carry this sense of calm within you always. When you're ready, gently open your eyes, knowing you can return to this peaceful state anytime."
      },
      creativity: {
        intro: "Welcome to your creativity session. Sit comfortably and close your eyes with gentle curiosity. Breathe in inspiration for 4 counts... hold for 4... breathe out limitations for 6 counts. Your creative mind is awakening.",
        main: "With each breath, feel your creative energy flowing freely. There are no wrong ideas, only possibilities waiting to be explored. Visualize your mind as a garden where new ideas can bloom. You are naturally creative and innovative. Trust in your unique perspective and artistic vision.",
        closing: "Feel this creative energy flowing through you. You carry infinite possibilities within. Take three inspiring breaths and open your eyes, ready to create with renewed vision."
      },
      energy: {
        intro: "Welcome to your energy session. Sit up straight and close your eyes with anticipation. Take a revitalizing breath in for 4 counts... hold for 4... breathe out fatigue for 6 counts. Feel your natural vitality stirring.",
        main: "With each breath, draw in fresh energy and vitality. Visualize bright, golden light filling your body with each inhale. You are naturally energetic and vibrant. Feel this energy flowing through your entire being, awakening every cell. You have all the energy you need to accomplish your goals.",
        closing: "Feel this vibrant energy settling into your being. You are refreshed and energized. Take three invigorating breaths and open your eyes, ready to embrace your day with renewed vitality."
      }
    }

    const script = scripts[assessment.goal as keyof typeof scripts] || scripts.relaxation
    const totalWords = this.countWords(script.intro + script.main + script.closing)

    return {
      intro_text: script.intro,
      main_content: script.main,
      closing_text: script.closing,
      total_words: totalWords,
      estimated_duration: assessment.duration
    }
  }
}

// Factory function to create script generator with API key
export const createScriptGenerator = () => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('OpenAI API key not found, using fallback scripts only')
    return new ScriptGenerator('')
  }
  return new ScriptGenerator(apiKey)
}