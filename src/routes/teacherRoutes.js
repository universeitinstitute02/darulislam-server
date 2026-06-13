const express = require("express");
const router = express.Router();
const {
  getPendingTeachers,
  approveTeacher,
  getPublicTeachers,
  deleteTeacher,
  getDashboardStats,
  toggleTeacherFeatured,
} = require("../controllers/teacherController");
const { protect, admin, instructor } = require("../middlewares/authMiddleware");

// Public Route
router.get("/", getPublicTeachers);

// Teacher Dashboard Stats
router.get("/dashboard-stats", protect, instructor, getDashboardStats);

// Protected Route (Admin)
router.get("/pending", protect, admin, getPendingTeachers);
router.put("/:id/approve", protect, admin, approveTeacher);
router.patch("/featured/:id", protect, admin, toggleTeacherFeatured);
router.delete("/:id", protect, admin, deleteTeacher);

module.exports = router;
