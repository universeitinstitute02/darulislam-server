const mongoose = require("mongoose");
const Category = require("./Category");

const teacherProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      unique: true,
    },
    teacherNameBn: { type: String, trim: true },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please select a department (Bivag)"],
      ref: Category,
    },
    designation: {
      type: String,
      required: [true, "Please add a designation"],
    },
    biography: {
      type: String,
    },
    qualifications: {
      type: String,
    },
    experience: {
      type: String,
      trim: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports =
  mongoose.models.TeacherProfile ||
  mongoose.model("TeacherProfile", teacherProfileSchema);