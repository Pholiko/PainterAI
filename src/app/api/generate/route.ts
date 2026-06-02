import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const { prompt } = await req.json();

        // NOTE: DALL-E 3 does not support image-to-image in this endpoint directly for "edit" without mask.
        // We use the text prompt (which should assume the room description) to generate a new visualization.

        const enhancedPrompt = prompt ?
            `Modern interior design capability. Show a photorealistic renovation of this room: ${prompt}. Bright, clean, professional painting job. Ultra detailed.` :
            "A freshly painted modern bright room with white walls, clean hardwood floor, photorealistic, 4k.";

        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: enhancedPrompt,
            n: 1,
            size: "1024x1024",
        });

        const imageUrl = response.data[0].url;

        return NextResponse.json({
            url: imageUrl,
            message: "Generated successfully with DALL-E 3"
        });

    } catch (error) {
        console.error("Error generating image:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
