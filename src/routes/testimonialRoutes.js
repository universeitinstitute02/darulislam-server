const express = require("express");
const router = express.Router();
const {
  createTestimonial,
  getPublicTestimonials,
  getAdminTestimonials,
  updateApprovalStatus,
  deleteTestimonial,
} = require("../controllers/testimonialController");

const { protect, admin } = require("../middlewares/authMiddleware");

const upload = require("../middlewares/uploadMiddleware");

router.get("/", getPublicTestimonials);

router.post("/", protect, upload.single("identityImage"), createTestimonial);

// Admin-only metrics routes
router.get("/admin", protect, admin, getAdminTestimonials);
router.put("/:id/approve", protect, admin, updateApprovalStatus);
router.delete("/:id", protect, admin, deleteTestimonial);

module.exports = router;