const express = require("express");
const router = express.Router();
const {
  createCourse,
  getCourses,
  updateCourse,
  deleteCourse,
  toggleCourseFeatured,
  getTeacherCourses,
  getEducationPageData,
  getDynamicCategories,
  getCoursesByCategoryName,
} = require("../controllers/courseController");
const { protect, instructor } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as an admin" });
  }
};

router.get("/", getCourses);
router.get("/education", getEducationPageData);
router.get("/teacher/my-courses", protect, instructor, getTeacherCourses);
router.get("/categories", getDynamicCategories);
router.get("/filter/:categoryName", getCoursesByCategoryName);

router.patch("/admin/featured/:id", protect, admin, toggleCourseFeatured);

router.post(
  "/teacher/add-course",
  protect,
  instructor,
  upload.single("image"),
  createCourse,
);
router.put(
  "/teacher/:id",
  protect,
  instructor,
  upload.single("image"),
  updateCourse,
);

router.delete("/teacher/delete-course/:id", protect, instructor, deleteCourse);

module.exports = router;