const express = require("express");
const router = express.Router();
const { getPublicStudents, toggleStudentFeatured } = require("../controllers/studentController");
const { protect, admin } = require("../middlewares/authMiddleware");

router.get("/", getPublicStudents);

router.patch("/featured/:id", protect, admin, toggleStudentFeatured);

module.exports = router;
