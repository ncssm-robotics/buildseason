import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

export const getUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      birthdate: user.birthdate,
    };
  },
});

/**
 * Update the current user's birthdate.
 * Required for YPP compliance - all team members must have a birthdate on file.
 */
export const updateBirthdate = mutation({
  args: {
    birthdate: v.number(), // Unix timestamp
  },
  handler: async (ctx, { birthdate }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Validate birthdate is reasonable (not in future, not more than 120 years ago)
    const now = Date.now();
    const minDate = now - 120 * 365.25 * 24 * 60 * 60 * 1000; // 120 years ago
    if (birthdate > now) {
      throw new Error("Birthdate cannot be in the future");
    }
    if (birthdate < minDate) {
      throw new Error("Birthdate is too far in the past");
    }

    await ctx.db.patch(userId, { birthdate });
    return userId;
  },
});
