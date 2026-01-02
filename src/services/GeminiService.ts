/**
 * Gemini AI Service - Secure Frontend Client
 *
 * Provides a clean interface to call Gemini AI through the secure Edge Function proxy.
 * API keys are never exposed to the client - all requests go through the backend.
 *
 * Usage:
 *   import { geminiService } from './services/GeminiService';
 *
 *   const response = await geminiService.generateText({
 *     prompt: 'Tell me about Paris',
 *     model: 'gemini-2.0-flash-exp'
 *   });
 */

import { supabase } from '../lib/supabase';
import { aiCache } from '../utils/aiCache';

export interface GeminiRequest {
  prompt?: string;
  model?: string;
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
    tools?: Array<{ google_search?: Record<string, never> }>;  // Fixed: Official Gemini 2.0+ API uses snake_case
    responseSchema?: any;
    responseMimeType?: string;
    thinkingConfig?: {
      thinkingBudget?: number;
    };
  };
}

export interface GeminiResponse {
  text: string;
  error?: string;
}

class GeminiService {
  /**
   * Generate text using Gemini AI
   * Calls the secure Edge Function proxy instead of Gemini directly
   * Includes caching and rate limiting
   */
  async generateText(request: GeminiRequest): Promise<string> {
    try {
      // Check rate limit
      if (aiCache.isRateLimited()) {
        const resetTime = aiCache.getResetTime();
        throw new Error(`Rate limit exceeded. Please wait ${resetTime} seconds before trying again.`);
      }

      // Check cache first (only for prompts without images)
      if (request.prompt && !request.image) {
        const cached = aiCache.get(request.prompt, request.model, request.config);
        if (cached) {
          return cached;
        }
      }

      const { data, error } = await supabase.functions.invoke<GeminiResponse>('gemini-proxy', {
        body: request,
      });

      if (error) {
        console.error('[GeminiService] Edge Function error:', error);
        throw new Error(`Gemini API call failed: ${error.message}`);
      }

      if (data?.error) {
        console.error('[GeminiService] Gemini API error:', data.error);
        throw new Error(data.error);
      }

      const response = data?.text || '';

      // Cache the response (only for prompts without images)
      if (request.prompt && !request.image && response) {
        aiCache.set(request.prompt, response, request.model, request.config);
      }

      return response;
    } catch (error) {
      console.error('[GeminiService] Request failed:', error);
      throw error;
    }
  }

  /**
   * Generate JSON using Gemini AI with schema validation
   * Useful for structured data extraction
   */
  async generateJSON<T = any>(request: Omit<GeminiRequest, 'config'> & {
    schema: any;
  }): Promise<T> {
    const response = await this.generateText({
      ...request,
      config: {
        ...request.config,
        responseMimeType: 'application/json',
        responseSchema: request.schema,
      },
    });

    try {
      return JSON.parse(response) as T;
    } catch (error) {
      console.error('[GeminiService] Failed to parse JSON response:', error);
      throw new Error('Invalid JSON response from Gemini');
    }
  }

  /**
   * Generate text with Google Search grounding
   * Useful for up-to-date information (weather, news, etc.)
   */
  async generateWithSearch(request: Omit<GeminiRequest, 'config'>): Promise<string> {
    return this.generateText({
      ...request,
      config: {
        ...request.config,
        tools: [{ google_search: {} }],  // Fixed: Official Gemini 2.0+ API uses snake_case
      },
    });
  }

  /**
   * Generate response from image + text prompt (vision/multimodal)
   * Useful for receipt scanning, document parsing, image analysis
   */
  async generateWithVision(request: {
    image: { mimeType: string; data: string };
    prompt: string;
    model?: string;
    schema?: any;
  }): Promise<string> {
    const config: any = {};
    if (request.schema) {
      config.responseMimeType = 'application/json';
      config.responseSchema = request.schema;
    }

    return this.generateText({
      prompt: request.prompt,
      image: request.image,
      model: request.model || 'gemini-2.0-flash-exp',
      config,
    });
  }
}

// Export singleton instance
export const geminiService = new GeminiService();

// Export for backward compatibility (can be removed later)
export { geminiService as default };
