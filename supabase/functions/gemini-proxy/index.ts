/**
 * Gemini AI Proxy - Secure Edge Function
 *
 * This Edge Function acts as a secure proxy between your frontend and Google's Gemini API.
 * The API key is stored server-side as a secret, never exposed to the client.
 *
 * Usage from frontend:
 *   const response = await fetch('https://your-project.supabase.co/functions/v1/gemini-proxy', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       model: 'gemini-2.0-flash-exp',
 *       prompt: 'Your prompt here',
 *       config: { ... } // Optional Gemini config
 *     })
 *   });
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// CORS headers for frontend access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeminiRequest {
  model?: string;
  prompt?: string;
  systemInstruction?: string;
  image?: {
    mimeType: string;
    data: string; // base64 encoded
  };
  config?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
    tools?: any[];
    responseSchema?: any;
    responseMimeType?: string;
    thinkingConfig?: {
      thinkingBudget?: number;
    };
  };
}

interface GeminiResponse {
  text: string;
  error?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Gemini API key from environment (set as Edge Function secret)
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured. Set it as an Edge Function secret.');
    }

    // Parse request body
    const { model = 'gemini-2.0-flash-exp', prompt, image, systemInstruction, config = {} }: GeminiRequest = await req.json();

    if (!prompt && !image) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: prompt or image' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build Gemini API request
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    // Build parts array for multimodal requests
    const parts: any[] = [];
    if (image) {
      parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
    }
    if (prompt) {
      parts.push({ text: prompt });
    }

    const geminiBody: any = {
      contents: [{ parts }]
    };

    // Add system instruction if provided
    if (systemInstruction) {
      geminiBody.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    // Add generation config if provided
    if (Object.keys(config).length > 0) {
      geminiBody.generationConfig = {};

      if (config.temperature !== undefined) geminiBody.generationConfig.temperature = config.temperature;
      if (config.maxOutputTokens !== undefined) geminiBody.generationConfig.maxOutputTokens = config.maxOutputTokens;
      if (config.topP !== undefined) geminiBody.generationConfig.topP = config.topP;
      if (config.topK !== undefined) geminiBody.generationConfig.topK = config.topK;
      if (config.responseMimeType) geminiBody.generationConfig.responseMimeType = config.responseMimeType;
      if (config.responseSchema) geminiBody.generationConfig.responseSchema = config.responseSchema;
    }

    // Add tools if provided (e.g., Google Search)
    if (config.tools) {
      geminiBody.tools = config.tools;
    }

    // Call Gemini API
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiBody),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error('Gemini API Error:', errorData);
      throw new Error(`Gemini API returned ${geminiResponse.status}: ${errorData}`);
    }

    const geminiData = await geminiResponse.json();

    // Extract text from response
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const response: GeminiResponse = { text };

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in gemini-proxy:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        text: ''
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
