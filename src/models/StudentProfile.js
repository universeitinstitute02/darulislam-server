const mongoose = require("mongoose");
const Category = require("./Category");

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      unique: true,
    },
    studentNameBn: { type: String, trim: true },
    classLevel: { type: String },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please select a department (Bivag)"],
      ref: Category,
    },
    fatherName: { type: String },
    fatherMobile: { type: String },
    fatherJob: { type: String },
    motherName: { type: String },
    motherMobile: { type: String },
    motherJob: { type: String },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.StudentProfile ||
  mongoose.model("StudentProfile", studentProfileSchema);