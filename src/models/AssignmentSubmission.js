const mongoose = require("mongoose");

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: [true, "Assignment reference is required"],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student reference is required"],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course reference is required"],
    },
    studentNotes: {
      type: String,
      trim: true,
    },
    submittedImages: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "reviewed"],
      default: "pending",
    },
    marksObtained: {
      type: Number,
      default: null,
    },
    instructorFeedback: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "AssignmentSubmission",
  assignmentSubmissionSchema,
);