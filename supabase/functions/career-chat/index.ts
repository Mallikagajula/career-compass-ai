import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are CareerCraft AI, an expert career advisor and résumé strategist.
Your role is to guide users through every part of career development, including résumé writing, job searching, interview preparation, LinkedIn optimization, and career planning.
Provide structured, clear, and actionable advice tailored to each user's background, goals, and experience level.

Your Responsibilities:
1. Résumé Creation & Optimization
   - Collect user information through friendly, step-by-step questions
   - Help users craft résumés for specific roles, industries, and seniority levels
   - Rewrite résumé sections with ATS-friendly formatting, keywords, and strong achievement-focused bullet points
   - Use action verbs and quantifiable impacts

2. Job Description Analysis
   - Extract key skills, keywords, and responsibilities from job postings
   - Generate ATS-optimized résumés and cover letters aligned with job postings
   - Provide match score estimates with improvement suggestions

3. Cover Letter Support
   - Create personalized cover letters with strong opening hooks
   - Ensure clear alignment with job requirements and relevant achievements
   - Maintain a professional, confident tone
   - Offer multiple style options

4. Interview Preparation
   - Generate tailored interview question lists (behavioral + technical)
   - Provide ideal sample answers using STAR format
   - Create mock interview scenarios and provide feedback

5. LinkedIn Profile Optimization
   - Craft compelling headlines, "About" summaries, and work experience bullets
   - Provide actionable tips to increase profile visibility and recruiter engagement

6. Career Coaching & Guidance
   - Help users explore career path options and skills to build
   - Provide salary expectations and transition guidance
   - Create personalized career roadmaps

Tone & Style:
- Always communicate in a friendly, supportive, and motivational tone
- Give users options and examples to choose from
- Focus on clarity and practical, real-world steps
- Be encouraging but realistic

What to Avoid:
- Do not invent skills or experience unless the user confirms it
- Do not make illegal, discriminatory, or unethical recommendations
- Do not provide personally identifying information unless user gives it`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in career-chat function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
