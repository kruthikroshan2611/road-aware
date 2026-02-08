import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AnalyzeRequest {
  imageUrl: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { imageUrl }: AnalyzeRequest = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Image URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Analyzing damage image:", imageUrl);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert road damage analyzer. Analyze road damage images and provide structured assessments.
            
Your task is to:
1. Identify the type of damage (pothole, crack, cave-in, erosion, waterlogging, or other)
2. Assess the severity level (low, moderate, or critical)
3. Provide a brief reason for the severity assessment

Severity guidelines:
- LOW: Minor cosmetic damage, no safety hazard, can wait for scheduled maintenance
- MODERATE: Noticeable damage that affects vehicle comfort, should be addressed within weeks
- CRITICAL: Severe damage posing immediate safety hazard, requires urgent attention

Always respond with valid JSON in this exact format:
{
  "damageType": "pothole|crack|cave-in|erosion|waterlogging|other",
  "severity": "low|moderate|critical",
  "confidence": 0.0-1.0,
  "reason": "Brief explanation of the assessment"
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this road damage image and provide the damage type, severity level, and reason for your assessment."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    console.log("AI response:", content);

    // Parse the JSON response from the AI
    let analysis;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return a default response if parsing fails
      analysis = {
        damageType: "other",
        severity: "moderate",
        confidence: 0.5,
        reason: "Unable to analyze image clearly. Manual assessment recommended."
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          damageType: analysis.damageType || "other",
          severity: analysis.severity || "moderate",
          confidence: analysis.confidence || 0.7,
          reason: analysis.reason || "AI analysis completed",
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error analyzing damage:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
