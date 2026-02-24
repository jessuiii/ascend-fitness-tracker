// AI chat using Groq - free tier, no billing required, 14,400 req/day
// Sign up at: https://console.groq.com → API Keys → Create API Key

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Groq free models (all have 14,400 req/day free)
const GROQ_MODELS = [
    'llama-3.1-8b-instant',    // Fastest - best for chat
    'gemma2-9b-it',            // Google Gemma 2 on Groq
    'llama-3.3-70b-versatile', // Most capable
];

const SYSTEM_PROMPT = `You are "Gym Buddy", an expert AI fitness assistant inside a gamified fitness tracker app. You are knowledgeable about:
- Exercise form and technique
- Workout programming and periodization
- Nutrition and diet advice
- Muscle anatomy and growth
- Recovery and injury prevention

Your Unique Value:
You have access to the user's CURRENT PROGRESS through a provided context block. Use this data to:
1. Reference their actual lifts and tiers when giving advice.
2. Analyze their workout history to suggest improvements.
3. Motivate them by pointing out their specific gains.

Guidelines:
- Be encouraging, motivating, and positive.
- Use the user's actual stats (lifts, path, tier) to be specific.
- Keep responses concise but thorough.
- Format with bullet points and sections when helpful.
- If medical advice is needed, recommend a professional.`;

function buildMessages(userMessage: string, history: { role: string; content: string }[], userContext?: any) {
    let contextualSystemPrompt = SYSTEM_PROMPT;

    if (userContext) {
        contextualSystemPrompt += `\n\nUSER CONTEXT DATA:
- Path: ${userContext.path}
- Current Tier: ${userContext.tier}
- BMI: ${userContext.bmi}
- Best Lifts: Squat ${userContext.lifts.squat}kg, Bench ${userContext.lifts.bench}kg, Deadlift ${userContext.lifts.deadlift}kg

ROUTINE (Planned Workouts):
${userContext.plannedRoutine && userContext.plannedRoutine.length > 0
                ? userContext.plannedRoutine.map((p: any) => `  * ${p.day}: ${p.exercise} (${p.sets} sets, ${p.reps} reps)`).join('\n')
                : "  (No workouts planned yet)"}

RECENT HISTORY (Last 10 sessions):
${userContext.recentWorkouts && userContext.recentWorkouts.length > 0
                ? userContext.recentWorkouts.map((w: any) => `  * ${w.date}: ${w.exercise} - ${w.weight}kg x ${w.reps} (${w.muscle_group})`).join('\n')
                : "  (No workout history tracked yet)"}

Instruction: Use this data as your source of truth. If the user asks about their history, routine, or progress, look HERE first. Do NOT say you don't have access to their history; if it is listed above, you have it!`;
    }

    const messages = [
        { role: 'system', content: contextualSystemPrompt },
    ];

    messages.push(...history.slice(0, -1).map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
    })));

    messages.push({ role: 'user', content: userMessage });
    return messages;
}

function getApiConfig() {
    const isGroq = !!process.env.GROQ_API_KEY;
    return {
        apiKey: process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || '',
        apiUrl: isGroq ? GROQ_API_URL : 'https://openrouter.ai/api/v1/chat/completions',
        models: isGroq ? GROQ_MODELS : ['meta-llama/llama-3.2-3b-instruct:free'],
        isGroq,
    };
}

// ── NON-STREAMING (legacy) ───────────────────────────────────────────────────
export async function chatWithGemini(
    userMessage: string,
    history: { role: string; content: string }[],
    userContext?: any
): Promise<string> {
    const { apiKey, apiUrl, models, isGroq } = getApiConfig();
    if (!apiKey) throw new Error('No AI API key configured. Please set GROQ_API_KEY in .env.local');

    const messages = buildMessages(userMessage, history, userContext);
    let lastError = '';

    for (const model of models) {
        try {
            const headers: Record<string, string> = {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            };
            if (!isGroq) {
                headers['HTTP-Referer'] = 'https://ascend-fit.app';
                headers['X-Title'] = 'Ascend';
            }

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({ model, messages, max_tokens: 1024, temperature: 0.7 }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.warn(`Model ${model} failed (${response.status}):`, errorData);
                lastError = response.statusText;
                if (response.status === 401) throw new Error('Invalid API key. Please check your key in .env.local');
                continue;
            }

            const data = await response.json();
            const text = data.choices?.[0]?.message?.content;
            if (!text) { lastError = 'Empty response'; continue; }
            return text;

        } catch (error) {
            if (error instanceof Error && error.message.includes('Invalid API key')) throw error;
            console.error(`Model ${model} error:`, error);
            lastError = error instanceof Error ? error.message : 'Unknown error';
            continue;
        }
    }

    throw new Error(`AI is temporarily unavailable: ${lastError}`);
}

// ── STREAMING ────────────────────────────────────────────────────────────────
export async function chatWithGeminiStream(
    userMessage: string,
    history: { role: string; content: string }[],
    userContext?: any
): Promise<ReadableStream<string>> {
    const { apiKey, apiUrl, models, isGroq } = getApiConfig();
    if (!apiKey) throw new Error('No AI API key configured. Please set GROQ_API_KEY in .env.local');

    const messages = buildMessages(userMessage, history, userContext);

    const headers: Record<string, string> = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
    };
    if (!isGroq) {
        headers['HTTP-Referer'] = 'https://ascend-fit.app';
        headers['X-Title'] = 'Ascend';
    }

    // Try models in order until one works
    let response: Response | null = null;
    for (const model of models) {
        const res = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ model, messages, max_tokens: 1024, temperature: 0.7, stream: true }),
        });

        if (res.ok) { response = res; break; }
        console.warn(`Streaming: model ${model} failed (${res.status})`);
        if (res.status === 401) throw new Error('Invalid API key. Please check your key in .env.local');
    }

    if (!response || !response.body) {
        throw new Error('AI is temporarily unavailable. Please try again.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    return new ReadableStream<string>({
        async start(controller) {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

                    for (const line of lines) {
                        const data = line.slice(6).trim();
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const token = parsed.choices?.[0]?.delta?.content;
                            if (token) controller.enqueue(token);
                        } catch {
                            // Skip unparseable chunks
                        }
                    }
                }
            } catch (err) {
                controller.error(err);
            } finally {
                controller.close();
            }
        },
    });
}
