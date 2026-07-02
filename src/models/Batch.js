const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Please link this batch to a specific course"],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    batchName: {
      type: String,
      required: [true, "Please add a batch identifier or name"],
      trim: true,
    },
    admissionStartDate: {
      type: Date,
      default: null,
    },
    classStartDate: {
      type: Date,
      default: null,
    },
    availableSeats: {
      type: Number,
      default: function () {
        return this.maxSeats;
      },
    },
    maxSeats: {
      type: Number,
      required: [true, "Please specify maximum seat capacity"],
      default: 30,
    },
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["upcoming", "active", "completed"],
      default: "upcoming",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Batch", batchSchema);
