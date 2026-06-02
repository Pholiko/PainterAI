import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient(); // Ensure only one instance

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Remove the duplicate block below this line if it exists in the file structure
// The previous replace might have messed up the structure.
// I will just make sure this file starts clean.

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

        // 1. Fetch User Settings for Calculation
        const user = await prisma.user.findUnique({
            where: { id: (session.user as any).id },
            select: { hourlyRate: true, materialCost: true }
        });

        const hourlyRate = user?.hourlyRate || 65.00; // Default fallback
        const materialPricePerLiter = user?.materialCost || 12.50; // Default fallback
        const coveragePerLiter = 6; // m² per liter (standard)
        const hoursPerSqm = 0.5; // 30 mins per m² (preparation + 2 coats)

        // 1a. Convert File to Buffer/Base64
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString('base64');
        const dataUrl = `data:${image.type};base64,${base64Image}`;

        // 2. Real AI Analysis (GPT-4o)
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "Du bist ein professioneller Maler-Assistent. Analysiere das Bild der Wand/des Raumes. " +
                        "Schätze die ungefähren Maße der Wand auf dem Foto. Gib eine ungefähre Schätzung mit einer Abweichung von +/- 15% an. " +
                        "Gib ein gültiges JSON-Objekt zurück (kein Markdown) mit folgender Struktur: " +
                        "{ \"wallWidth\": number (geschätzte Breite der Wand in Metern), " +
                        "\"wallHeight\": number (geschätzte Höhe der Wand in Metern), " +
                        "\"tolerancePercent\": 15, " +
                        "\"wallArea\": number (geschätzte Fläche in m², Breite x Höhe), " +
                        "\"roomHeight\": number (in Metern, typisch 2.4-3.5), " +
                        "\"conditions\": string (kurze Beschreibung des Wandzustands auf Deutsch), " +
                        "\"prepSteps\": string[] (Liste von 3-5 Vorbereitungsschritten auf Deutsch), " +
                        "\"visualizationPrompt\": string (ein beschreibender Prompt auf Englisch, um eine 'frisch gestrichene, moderne, helle Version' dieses Raumes mit DALL-E zu generieren) }"
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analyze this wall for repainting and provide the needed data." },
                        {
                            type: "image_url",
                            image_url: {
                                url: dataUrl
                            }
                        }
                    ]
                }
            ],
            max_tokens: 500,
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        let analysisData;

        try {
            analysisData = JSON.parse(content || "{}");
        } catch (e) {
            console.error("Failed to parse GPT response", content);
            // Fallback or error
            throw new Error("Invalid JSON from GPT");
        }

        // Mapping to internal names if necessary (GPT keys match our code variables luckily)
        const wallArea = analysisData.wallArea || 25;
        const roomHeight = analysisData.roomHeight || 2.5;
        const conditions = analysisData.conditions || "Standard";
        const prepSteps = analysisData.prepSteps || ["Abkleben", "Bodenschutz"];

        const wallWidth = analysisData.wallWidth || 5;
        const wallHeight = analysisData.wallHeight || roomHeight;
        const tolerancePercent = analysisData.tolerancePercent || 15;

        // 3. Perform Calculations
        const paintLiters = Math.ceil((wallArea / coveragePerLiter) * 2); // 2 coats
        const laborHours = wallArea * hoursPerSqm;

        const materialCostTotal = paintLiters * materialPricePerLiter;
        const laborCostTotal = laborHours * hourlyRate;
        const netPrice = materialCostTotal + laborCostTotal;
        const tax = netPrice * 0.19; // 19% VAT
        const totalPrice = netPrice + tax;

        // 4. Return Structured Data
        return NextResponse.json({
            analysis: {
                dimensions: {
                    area: wallArea,
                    height: roomHeight,
                    wallWidth,
                    wallHeight,
                    tolerancePercent
                },
                details: {
                    condition: conditions,
                    steps: prepSteps,
                    visualizationPrompt: analysisData.visualizationPrompt // Pass this to frontend/generate
                },
                calculation: {
                    paintLiters,
                    laborHours,
                    materialCost: materialCostTotal,
                    laborCost: laborCostTotal,
                    netPrice,
                    tax,
                    totalPrice,
                    ratesUsed: {
                        hourly: hourlyRate,
                        material: materialPricePerLiter
                    }
                }
            }
        });

    } catch (error) {
        console.error("Analysis failed:", error);
        return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
    }
}
