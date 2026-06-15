const mongoose = require("mongoose");

const donationCampaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Campaign title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Campaign description is required"],
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    goalAmount: {
      type: Number,
      required: [true, "Goal amount is required"],
      min: [1, "Goal must be at least 1 Taka"],
    },
    raisedAmount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("DonationCampaign", donationCampaignSchema);