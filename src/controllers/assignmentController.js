const Assignment = require("../models/Assignment");
const AssignmentSubmission = require("../models/AssignmentSubmission");

// Fetch all student submissions for a specific instructor
const getInstructorSubmissions = async (req, res) => {
  try {
    const instructorId = req.user._id;
    const { status } = req.query;

    const queryFilter = {};
    if (status) {
      queryFilter.status = status;
    }

    const submissions = await AssignmentSubmission.find(queryFilter)
      .populate({
        path: "assignment",
        match: { instructor: instructorId },
        select: "title totalMarks",
      })
      .populate("student", "name profilePicture")
      .populate("course", "title category")
      .sort({ createdAt: -1 });

    // Filter out submissions belonging to other instructors' courses
    const filteredSubmissions = submissions.filter(
      (submission) => submission.assignment !== null,
    );

    res.status(200).json(filteredSubmissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Grade and provide feedback for a student submission
const evaluateSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marksObtained, instructorFeedback } = req.body;

    if (marksObtained === undefined || marksObtained === null) {
      return res.status(400).json({ message: "Marks allocation is required" });
    }

    const submission =
      await AssignmentSubmission.findById(submissionId).populate("assignment");
    if (!submission) {
      return res.status(404).json({ message: "Submission records not found" });
    }

    if (
      submission.assignment.instructor.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized operation on this asset" });
    }

    if (marksObtained > submission.assignment.totalMarks) {
      return res.status(400).json({
        message: `Obtained marks cannot exceed total value of ${submission.assignment.totalMarks}`,
      });
    }

    submission.marksObtained = marksObtained;
    submission.instructorFeedback = instructorFeedback || "";
    submission.status = "reviewed";

    await submission.save();

    res.status(200).json({
      message: "Submission evaluated successfully",
      data: submission,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch operational evaluation metrics for the dashboard footer
const getEvaluationStats = async (req, res) => {
  try {
    const instructorId = req.user._id;

    const assignments = await Assignment.find({
      instructor: instructorId,
    }).select("_id");
    const assignmentIds = assignments.map((asm) => asm._id);

    const pendingCount = await AssignmentSubmission.countDocuments({
      assignment: { $in: assignmentIds },
      status: "pending",
    });

    res.status(200).json({ pendingAssignmentsCount: pendingCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getInstructorSubmissions,
  evaluateSubmission,
  getEvaluationStats,
};
