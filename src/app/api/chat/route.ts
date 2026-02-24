import { NextRequest, NextResponse } from 'next/server';
import { chatWithGemini } from '@/lib/gemini';

export async function POST(request: NextRequest) {
    try {
        const { message, history, userContext } = await request.json();

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        // Pass userContext to the AI for personalized responses
        const aiResponse = await chatWithGemini(message, history || [], userContext);

        return NextResponse.json({ message: aiResponse });
    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to process chat message' },
            { status: 500 }
        );
    }
}
