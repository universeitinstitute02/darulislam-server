const Category = require("../models/Category");
const mongoose = require("mongoose");

const generateSlug = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0980-\u09ff-]+/g, "");
};

const getCategories = async (req, res) => {
  try {
    let matchQuery = {};
    if (req.query.isFeatured) {
      matchQuery.isFeatured = req.query.isFeatured === "true";
    }

    const categories = await Category.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "category",
          pipeline: [{ $match: { isPublished: true } }],
          as: "publishedCourses",
        },
      },
      {
        $addFields: {
          courseCount: { $size: "$publishedCourses" },
        },
      },
      {
        $project: {
          publishedCourses: 0,
        },
      },
    ]);

    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description, isActive, isFeatured, subCategories } = req.body;

    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({ message: "Category already exists" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Category image is required" });
    }

    const imageUrl = req.file.path;

    let formattedSubCategories = [];
    if (subCategories) {
      const parsedSub =
        typeof subCategories === "string"
          ? JSON.parse(subCategories)
          : subCategories;

      if (Array.isArray(parsedSub)) {
        formattedSubCategories = parsedSub.map((sub) => {
          if (typeof sub === "string") {
            return {
              name: sub,
              slug: generateSlug(sub),
              highlights: [],
            };
          }
          return {
            ...sub,
            slug: sub.slug || generateSlug(sub.name),
            admissionFee: Number(sub.admissionFee) || 0,
            oldAdmissionFee: Number(sub.oldAdmissionFee) || 0,
            monthlyFee: Number(sub.monthlyFee) || 0,
            discount: Number(sub.discount) || 0,
            highlights: Array.isArray(sub.highlights) ? sub.highlights : [],
          };
        });
      }
    }

    const category = await Category.create({
      name,
      image: imageUrl,
      description,
      isActive: isActive === "false" ? false : true,
      isFeatured: isFeatured === "true" ? true : false,
      subCategories: formattedSubCategories,
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const {
      name,
      description,
      isActive,
      isFeatured,
      subCategories,
      isMainCategoryQuery,
    } = req.body;
    let updateData = {};

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined)
      updateData.isActive = isActive === "false" ? false : true;
    if (isFeatured !== undefined)
      updateData.isFeatured = isFeatured === "true" ? true : false;

    if (req.file && isMainCategoryQuery === "true") {
      updateData.image = req.file.path;
    }

    if (subCategories) {
      const parsedSub =
        typeof subCategories === "string"
          ? JSON.parse(subCategories)
          : subCategories;

      if (Array.isArray(parsedSub)) {
        updateData.subCategories = parsedSub.map((sub) => {
          const baseSub = typeof sub === "string" ? { name: sub } : sub;
          let currentSubImage = baseSub.image || "";

          if (req.file && baseSub.isNewlyUploaded === true) {
            currentSubImage = req.file.path;
          }

          delete baseSub.isNewlyUploaded;

          return {
            ...baseSub,
            _id: baseSub._id
              ? new mongoose.Types.ObjectId(baseSub._id)
              : new mongoose.Types.ObjectId(),
            name: baseSub.name,
            slug: baseSub.slug || generateSlug(baseSub.name),
            image: currentSubImage,
            fullTitle: baseSub.fullTitle || baseSub.name,
            classSchedule: baseSub.classSchedule || "",
            icon: baseSub.icon || "BookOpen",
            description: baseSub.description || "",
            isActive: baseSub.isActive !== undefined ? baseSub.isActive : true,
            admissionFee: Number(baseSub.admissionFee) || 0,
            oldAdmissionFee: Number(baseSub.oldAdmissionFee) || 0,
            monthlyFee: Number(baseSub.monthlyFee) || 0,
            discount: Number(baseSub.discount) || 0,
            coupon: baseSub.coupon || "",
            highlights: Array.isArray(baseSub.highlights)
              ? baseSub.highlights
              : [],
          };
        });
      }
    } else {
      updateData.subCategories = category.subCategories;
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    res.status(200).json(updatedCategory);
  } catch (error) {
    console.error("Error updating category/sub-category:", error);
    res.status(500).json({ message: error.message });
  }
};

const toggleCategoryFeatured = async (req, res) => {
  try {
    const { isFeatured } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isFeatured },
      { new: true, runValidators: true },
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({
      success: true,
      message: "Category featured status updated successfully",
      category,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await category.deleteOne();
    res
      .status(200)
      .json({ id: req.params.id, message: "Category removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCategoryByIdOrSlug = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let query = {};

    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = idOrSlug;
    } else {
      query.slug = idOrSlug;
    }

    const category = await Category.findOne(query).lean();
    if (!category) {
      return res.status(404).json({ message: "Category parameters not found" });
    }

    const Course = require("../models/Course");
    const Batch = require("../models/Batch");

    const coursesUnderCategory = await Course.find({
      category: category._id,
      isPublished: true,
    })
      .select("_id subCategory")
      .lean();

    const courseIds = coursesUnderCategory.map((c) => c._id);

    const upcomingBatches = await Batch.find({
      course: { $in: courseIds },
      status: "upcoming",
    })
      .select(
        "course batchName maxSeats availableSeats admissionStartDate classStartDate status",
      )
      .sort({ createdAt: -1 })
      .lean();

    const updatedSubCategories = category.subCategories.map((sub) => {
      const targetCourseIds = coursesUnderCategory
        .filter(
          (c) =>
            c.subCategory && c.subCategory.toString() === sub._id.toString(),
        )
        .map((c) => c._id.toString());

      const matchedBatch = upcomingBatches.find((b) =>
        targetCourseIds.includes(b.course.toString()),
      );

      return {
        ...sub,
        upcomingBatch: matchedBatch || null,
      };
    });

    res.status(200).json({
      ...category,
      subCategories: updatedSubCategories,
    });
  } catch (error) {
    console.error("Error in getCategoryByIdOrSlug with Batch mapping:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  toggleCategoryFeatured,
  deleteCategory,
  getCategoryByIdOrSlug,
};
