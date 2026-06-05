const express = require("express");
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

// Import both middlewares
const { protect, admin } = require("../middlewares/authMiddleware");

// GET Category
router.get("/", getCategories);

// POST request Admin Verify
router.post("/", protect, admin, createCategory);

// Update & Delete Category (admin)
router.put("/:id", protect, admin, updateCategory);
router.delete("/:id", protect, admin, deleteCategory);

module.exports = router;