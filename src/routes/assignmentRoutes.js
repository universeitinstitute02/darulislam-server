const express = require("express");
const router = express.Router();
const {
  getInstructorSubmissions,
  evaluateSubmission,
  getEvaluationStats,
} = require("../controllers/assignmentController");
const { protect, instructor } = require("../middlewares/authMiddleware");

// Dashboard operational matrix statistics (MUST BE ABOVE dynamic segments)
router.get("/teacher/stats", protect, instructor, getEvaluationStats);

// Fetch submissions target list
router.get(
  "/teacher/submissions",
  protect,
  instructor,
  getInstructorSubmissions,
);

// Process mutation update for assignment evaluations
router.patch(
  "/teacher/evaluate/:submissionId",
  protect,
  instructor,
  evaluateSubmission,
);

module.exports = router;