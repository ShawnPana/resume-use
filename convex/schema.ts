import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  header: defineTable({
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
  }).index("by_email", ["email"]),

  education: defineTable({
    university: v.string(),
    degree: v.string(),
    major: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    gpa: v.optional(v.string()),
    coursework: v.optional(v.array(v.string())),
  }),

  experience: defineTable({
    title: v.string(),
    position: v.optional(v.string()),
    employmentType: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    url: v.optional(v.string()),
    description: v.optional(v.string()),
  }),

  projects: defineTable({
    title: v.string(),
    event: v.optional(v.string()),
    award: v.optional(v.union(v.string(), v.array(v.string()))),
    organization: v.optional(v.string()),
    date: v.string(),
    endDate: v.optional(v.string()),
    url: v.optional(v.string()),
    description: v.optional(v.string()),
  }),
});