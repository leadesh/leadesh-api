import mongoose from "mongoose";
const { Schema, model } = mongoose;

const SubscriptionPlanSchema = new Schema(
  {
    planType: {
      type: String, 
      enum: ["Starter", "Pro"]
    },
    planPrice: {
      type: Number,
      required: true,
    },
    noOfKeywords: {
      type:  Number,
      required: true,
      default: 5,
    },
  },
  { timestamps: true }
);

export const SubscriptionPlan = model("subscriptionPlan", SubscriptionPlanSchema);
