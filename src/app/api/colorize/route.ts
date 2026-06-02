import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const image = formData.get("image") as File;

        if (!image) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        // Convert the image to evaluate & send to Gemini API
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString('base64');
        const mimeType = image.type;

        // The user put the Gemini API Key under NANO_BANANA_API_KEY
        const apiKey = process.env.NANO_BANANA_API_KEY;
        
        if (!apiKey) {
            console.warn("API Key is missing!");
            return NextResponse.json({ error: "API Key is missing." }, { status: 500 });
        }

        const targetColorHex = formData.get("targetColorHex") as string || "#000000";
        const targetColorName = formData.get("targetColorName") as string || "Schwarz";

        console.log(`Calling Gemini 3.1 Flash Image API, Color: ${targetColorName} (${targetColorHex})`);
        
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-image" });

        const prompt = `Please change the color of the wall in this room to exactly this color: ${targetColorName} (Hex: ${targetColorHex}). Keep the furniture, floor, and other elements exactly as they are. Only change the wall color.`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType
                }
            }
        ]);

        const responseContent = result.response.candidates?.[0]?.content;
        if (!responseContent || !responseContent.parts) {
            throw new Error("Invalid response format from Gemini API");
        }

        // Attempt to extract the image returned as inlineData
        const base64Part = responseContent.parts.find((p: any) => p.inlineData);
        let finalImageUrl;

        if (base64Part && base64Part.inlineData) {
            const outBase64 = base64Part.inlineData.data;
            const outMime = base64Part.inlineData.mimeType || "image/jpeg";
            finalImageUrl = `data:${outMime};base64,${outBase64}`;
        } else {
            console.error("No image data found in response parts. Response was:", JSON.stringify(responseContent.parts));
            // Failsafe fallback
            finalImageUrl = `data:${mimeType};base64,${base64Image}`;
        }

        return NextResponse.json({
            url: finalImageUrl,
            message: "Colorized successfully"
        });

    } catch (error) {
        console.error("Colorization failed:", error);
        return NextResponse.json({ error: "Colorization failed: " + (error as any).message }, { status: 500 });
    }
}
