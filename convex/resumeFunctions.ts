import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";

// Clear all data mutation
export const clearAllData = mutation({
  handler: async (ctx) => {
    const tables = ["header", "education", "experience", "projects"];

    for (const table of tables) {
      const docs = await ctx.db.query(table as any).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
    }

    return { success: true, message: "All data cleared" };
  },
});

// Header mutations
export const upsertHeader = mutation({
  args: {
    name: v.string(),
    tagline: v.optional(v.string()),
    email: v.string(),
    website: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    github: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    lastUpdated: v.optional(v.string()),
    skills: v.optional(v.record(v.string(), v.array(v.string()))),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("header")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      return await ctx.db.patch(existing._id, args);
    }
    return await ctx.db.insert("header", args);
  },
});

// Education mutations
export const upsertEducation = mutation({
  args: {
    university: v.string(),
    degree: v.string(),
    major: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    gpa: v.optional(v.string()),
    coursework: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Clear existing education and insert new
    const existing = await ctx.db.query("education").collect();
    for (const doc of existing) {
      await ctx.db.delete(doc._id);
    }
    return await ctx.db.insert("education", args);
  },
});

// Experience mutations
export const addExperience = mutation({
  args: {
    title: v.string(),
    position: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    url: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("experience", args);
  },
});

export const updateExperience = mutation({
  args: {
    id: v.id("experience"),
    title: v.string(),
    position: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    url: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updateData } = args;
    return await ctx.db.patch(id, updateData);
  },
});

export const deleteExperience = mutation({
  args: {
    id: v.id("experience"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

// Project mutations
export const addProject = mutation({
  args: {
    title: v.string(),
    event: v.optional(v.string()),
    award: v.optional(v.union(v.string(), v.array(v.string()))),
    organization: v.optional(v.string()),
    date: v.string(),
    endDate: v.optional(v.string()),
    url: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("projects", args);
  },
});

export const updateProject = mutation({
  args: {
    id: v.id("projects"),
    title: v.string(),
    event: v.optional(v.string()),
    award: v.optional(v.union(v.string(), v.array(v.string()))),
    organization: v.optional(v.string()),
    date: v.string(),
    endDate: v.optional(v.string()),
    url: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updateData } = args;
    return await ctx.db.patch(id, updateData);
  },
});

export const deleteProject = mutation({
  args: {
    id: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

// Query functions
export const getHeader = query({
  handler: async (ctx) => {
    return await ctx.db.query("header").first();
  },
});

export const getEducation = query({
  handler: async (ctx) => {
    return await ctx.db.query("education").first();
  },
});

export const getExperience = query({
  handler: async (ctx) => {
    return await ctx.db.query("experience").collect();
  },
});

export const getProjects = query({
  handler: async (ctx) => {
    return await ctx.db.query("projects").collect();
  },
});

export const getFullResume = query({
  handler: async (ctx) => {
    const [header, education, experience, projects] = await Promise.all([
      ctx.db.query("header").first(),
      ctx.db.query("education").first(),
      ctx.db.query("experience").collect(),
      ctx.db.query("projects").collect(),
    ]);

    return {
      header,
      education,
      experience,
      projects,
    };
  },
});

// Action to import JSON data
export const importResumeData = action({
  args: {
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const { data } = args;

    // Clear existing data first
    await ctx.runMutation(api.resumeFunctions.clearAllData);

    // Import header with skills
    if (data.header) {
      await ctx.runMutation(api.resumeFunctions.upsertHeader, {
        name: data.header.name,
        tagline: data.header.tagline || undefined,
        email: data.header.email,
        website: data.header.website || undefined,
        linkedin: data.header.linkedin || undefined,
        github: data.header.github || undefined,
        phone: data.header.phone || undefined,
        location: data.header.location || undefined,
        lastUpdated: data.header.lastUpdated || undefined,
        skills: data.header.skills || undefined,
      });
    }

    // Import education
    if (data.education) {
      await ctx.runMutation(api.resumeFunctions.upsertEducation, {
        university: data.education.university,
        degree: data.education.degree,
        major: data.education.major,
        startDate: data.education.startDate,
        endDate: data.education.endDate,
        gpa: data.education.gpa || undefined,
        coursework: data.education.coursework || undefined,
      });
    }

    // Import experience
    if (data.experience && Array.isArray(data.experience)) {
      for (const exp of data.experience) {
        await ctx.runMutation(api.resumeFunctions.addExperience, {
          title: exp.title,
          position: exp.position,
          startDate: exp.startDate,
          endDate: exp.endDate,
          url: exp.url || undefined,
          description: (exp.highlights || []).join(' • ') || undefined,
        });
      }
    }

    // Import projects
    if (data.projects && Array.isArray(data.projects)) {
      for (const proj of data.projects) {
        // Convert single award string to array if needed
        let awardArray = undefined;
        if (proj.award) {
          awardArray = Array.isArray(proj.award) ? proj.award : [proj.award];
        }

        await ctx.runMutation(api.resumeFunctions.addProject, {
          title: proj.title,
          event: proj.event || undefined,
          award: awardArray,
          organization: proj.organization || undefined,
          date: proj.date,
          endDate: proj.endDate || undefined,
          url: proj.url || undefined,
          description: (proj.highlights || []).join(' • ') || undefined,
        });
      }
    }

    return {
      success: true,
      message: "Resume data imported successfully",
      stats: {
        header: data.header ? 1 : 0,
        education: data.education ? 1 : 0,
        experience: data.experience?.length || 0,
        projects: data.projects?.length || 0,
      }
    };
  },
});