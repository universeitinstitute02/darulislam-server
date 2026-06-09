const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a category name"],
      unique: true,
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Please add a category image URL"],
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