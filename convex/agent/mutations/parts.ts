import { internalMutation } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Internal mutations for parts, used by the agent.
 */

export const adjustQuantity = internalMutation({
  args: {
    partId: v.id("parts"),
    adjustment: v.number(),
  },
  handler: async (ctx, { partId, adjustment }) => {
    const part = await ctx.db.get(partId);
    if (!part) {
      return { success: false, error: "Part not found" };
    }

    const newQuantity = part.quantity + adjustment;
    if (newQuantity < 0) {
      return {
        success: false,
        error: `Cannot reduce quantity below zero. Current: ${part.quantity}, Adjustment: ${adjustment}`,
      };
    }

    await ctx.db.patch(partId, { quantity: newQuantity });

    return {
      success: true,
      partName: part.name,
      previousQuantity: part.quantity,
      newQuantity,
      adjustment,
      isNowLowStock: newQuantity <= part.reorderPoint,
    };
  },
});
