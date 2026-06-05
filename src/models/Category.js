const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a category name"],
      unique: true,
      trim: true,
    },
    icon: {
      type: String,
      required: [true, "Please add an icon identifier or URL"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    subCategories: [
      {
        name: {
          type: String,
          required: [true, "Please add a sub-category name"],
          trim: true,
        },
        icon: {
          type: String,
          default: "BookOpen",
        },
        description: {
          type: String,
          trim: true,
          default: "",
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Category", categorySchema);
