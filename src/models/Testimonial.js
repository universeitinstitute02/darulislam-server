const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", // Links to the author who wrote it
    },
    text: {
      type: String,
      required: [true, "Please add the testimonial text"],
      maxlength: [500, "Testimonial cannot be more than 500 characters"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    identityImage: {
      type: String,
      default: null,
    },
    userType: {
      type: String,
      required: [true, "Please specify the author user type"],
      enum: ["student", "teacher", "female_teacher", "parent"],
      default: "student",
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Testimonial", testimonialSchema);