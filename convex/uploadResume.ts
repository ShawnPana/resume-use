"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { ResumeParser, ResumeData } from "./resumeParser";

export const uploadAndParseResume = action({
  args: {
    file: v.string(), // base64 encoded file
    fileType: v.string(), // "pdf" or "docx"
  },
  handler: async (ctx, args) => {
    try {
      // Get API key from environment
      const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
      if (!anthropicApiKey) {
        throw new Error("Anthropic API key not configured in environment");
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(args.file, "base64");

      // Initialize parser with API key
      const parser = new ResumeParser(anthropicApiKey);

      // Parse the resume
      const parsedData = await parser.parseResume(buffer, args.fileType);

      // Import the parsed data to Convex database
      await importToDatabase(ctx, parsedData);

      return {
        success: true,
        data: parsedData,
        message: "Resume parsed and imported successfully"
      };
    } catch (error) {
      console.error("Error parsing resume:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        data: null
      };
    }
  },
});

async function importToDatabase(ctx: any, data: ResumeData) {
  try {
    // Import header data
    if (data.header) {
      await ctx.runMutation("resumeFunctions:upsertHeader", {
        email: data.header.email || "",
        github: data.header.github || "",
        lastUpdated: data.header.lastUpdated || "",
        linkedin: data.header.linkedin || "",
        location: data.header.location || "",
        name: data.header.name || "",
        phone: data.header.phone || "",
        skills: data.header.skills || {},
        tagline: data.header.tagline || "",
        website: data.header.website || "",
      });
    }

    // Import education data
    if (data.education && Object.keys(data.education).length > 0) {
      await ctx.runMutation("resumeFunctions:upsertEducation", {
        coursework: data.education.coursework || [],
        degree: data.education.degree || "",
        endDate: data.education.endDate || "",
        gpa: data.education.gpa || "",
        major: data.education.major || "",
        startDate: data.education.startDate || "",
        university: data.education.university || "",
      });
    }

    // Clear existing experiences and import new ones
    await ctx.runMutation("resumeFunctions:clearExperiences", {});
    if (data.experience && Array.isArray(data.experience)) {
      for (const exp of data.experience) {
        await ctx.runMutation("resumeFunctions:addExperience", {
          description: exp.description || "",
          endDate: exp.endDate || "",
          position: exp.position || "",
          location: exp.location || "",
          employmentType: exp.employmentType || "",
          startDate: exp.startDate || "",
          title: exp.title || "",
          url: exp.url || "",
        });
      }
    }

    // Clear existing projects and import new ones
    await ctx.runMutation("resumeFunctions:clearProjects", {});
    if (data.projects && Array.isArray(data.projects)) {
      for (const proj of data.projects) {
        await ctx.runMutation("resumeFunctions:addProject", {
          award: proj.award || "",
          date: proj.date || "",
          description: proj.description || "",
          endDate: proj.endDate || "",
          event: proj.event || "",
          organization: proj.organization || "",
          title: proj.title || "",
          url: proj.url || "",
        });
      }
    }
  } catch (error) {
    console.error("Error importing to database:", error);
    throw error;
  }
}