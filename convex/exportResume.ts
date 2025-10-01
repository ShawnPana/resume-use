import { action } from "./_generated/server";
import { v } from "convex/values";

export const exportResume = action({
  args: {
    format: v.union(v.literal("pdf"), v.literal("latex"), v.literal("json")),
    filename: v.optional(v.string()),
  },
  handler: async (_ctx, args): Promise<{
    success: boolean;
    message: string;
    filename?: string;
    content?: string;
    mime_type?: string;
    error?: string;
  }> => {
    try {
      // Try to call the backend API
      const API_URL = process.env.RESUME_EXPORT_API_URL || 'http://localhost:8000';

      console.log(`Calling resume export API at: ${API_URL}`);

      const response = await fetch(`${API_URL}/resume/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: args.format,
          filename: args.filename || 'resume'
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error: ${error}`);
      }

      const result = await response.json();

      if (!result.success) {
        return {
          success: false,
          message: result.message || 'Failed to export resume',
          error: result.error_details
        };
      }

      return {
        success: true,
        message: result.message,
        filename: result.filename,
        content: result.content, // Base64 encoded file content
        mime_type: result.mime_type
      };

    } catch (error: any) {
      console.error('Error exporting resume:', error);

      // Provide helpful error messages
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
        return {
          success: false,
          message: "Backend API is not running. Please start the API server.",
          error: "To start the API: cd backend && python api.py"
        };
      }

      if (error.message.includes('forbidden')) {
        return {
          success: false,
          message: "Cannot access localhost from Convex deployment.",
          error: "For production, deploy your API or use ngrok for local development."
        };
      }

      return {
        success: false,
        message: error.message || "Failed to export resume",
        error: error.toString()
      };
    }
  },
});

// Alternative: Direct export without backend (JSON only)
export const exportResumeDirectly = action({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> => {
    try {
      // Get resume data directly from Convex
      const resumeData = await ctx.runQuery(api.resumeFunctions.getFullResume);

      return {
        success: true,
        message: "Resume data fetched successfully",
        data: resumeData
      };
    } catch (error: any) {
      console.error('Error fetching resume data:', error);
      return {
        success: false,
        message: error.message || "Failed to fetch resume data"
      };
    }
  },
});

import { api } from "./_generated/api";