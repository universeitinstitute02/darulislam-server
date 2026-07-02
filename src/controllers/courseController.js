const Course = require("../models/Course");
const Category = require("../models/Category");
const mongoose = require("mongoose");

// Create new course (handles dynamic courseType)
const createCourse = async (req, res) => {
  try {
    const {
      title,
      category,
      subCategory,
      courseCategoryType, // academic or general
      duration,
      courseType,
      price,
      oldPrice,
      label,
      details,
      modules,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Course thumbnail is required" });
    }

    let parsedDetails = {};
    if (details) {
      parsedDetails =
        typeof details === "string" ? JSON.parse(details) : details;
    }

    let parsedModules = [];
    if (modules) {
      parsedModules =
        typeof modules === "string" ? JSON.parse(modules) : modules;
    }

    let finalPrice = price || 0;
    let finalOldPrice = oldPrice || 0;

    if (courseCategoryType === "academic" && subCategory) {
      const Category = require("../models/Category");
      const matchedCategory = await Category.findOne({
        "subCategories._id": subCategory,
      }).lean();
      if (matchedCategory) {
        const targetSub = matchedCategory.subCategories.find(
          (sub) => sub._id.toString() === subCategory.toString(),
        );
        if (targetSub) {
          finalPrice = targetSub.admissionFee || 0;
          finalOldPrice = targetSub.oldAdmissionFee || 0;
        }
      }
    }

    const finalCourseType =
      courseCategoryType === "academic"
        ? "academic"
        : (courseType || "general").toLowerCase().trim();

    const course = await Course.create({
      title,
      image: req.file.path,
      category,
      subCategory: courseCategoryType === "academic" ? subCategory : undefined,
      courseCategoryType: courseCategoryType || "general",
      instructor: req.user._id,
      duration,
      courseType: finalCourseType,
      price: courseCategoryType === "academic" ? finalPrice : price || 0,
      oldPrice:
        courseCategoryType === "academic" ? finalOldPrice : oldPrice || 0,
      label: label || "",
      modules: parsedModules,
      details: parsedDetails,
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get education page data with categorized course sections & integrated upcoming batches
const getEducationPageData = async (req, res) => {
  try {
    const activeCategories = await Category.find({ isActive: true }).lean();
    const allCourses = await Course.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .lean();

    const Batch = require("../models/Batch");
    const courseIds = allCourses.map((c) => c._id);

    const allUpcomingBatches = await Batch.find({
      course: { $in: courseIds },
      status: "upcoming",
    })
      .select(
        "course batchName maxSeats availableSeats admissionStartDate classStartDate status",
      )
      .sort({ createdAt: -1 })
      .lean();

    const updatedCategories = activeCategories.map((category) => {
      if (!category.subCategories || !Array.isArray(category.subCategories))
        return category;

      const updatedSubCategories = category.subCategories.map((sub) => {
        const targetCourseIds = allCourses
          .filter(
            (c) =>
              c.subCategory && c.subCategory.toString() === sub._id.toString(),
          )
          .map((c) => c._id.toString());

        const matchedBatch = allUpcomingBatches.find((b) =>
          targetCourseIds.includes(b.course.toString()),
        );

        return {
          ...sub,
          upcomingBatch: matchedBatch || null,
        };
      });

      return {
        ...category,
        subCategories: updatedSubCategories,
      };
    });

    // Section setup for fixed course groups
    const fixedSections = [
      { key: "free", label: "ফ্রি কোর্স সমূহ" },
      { key: "academic", label: "একাডেমিক কোর্স সমূহ" },
      { key: "bundle", label: "বান্ডেল কোর্স সমূহ" },
      { key: "deras", label: "দরসি কিতাব কোর্স সমূহ" },
      { key: "premium", label: "প্রিমিয়াম কোর্স সমূহ" },
      { key: "short", label: "শর্ট কোর্স সমূহ" },
    ];

    // Categorize courses by section config (For general courses card layout)
    const fixedGroupedData = fixedSections.map((section) => {
      const matchedCourses = allCourses.filter((course) => {
        if (section.key === "academic") {
          return (
            String(course.courseType || "")
              .toLowerCase()
              .trim() === "academic" ||
            String(course.courseCategoryType || "")
              .toLowerCase()
              .trim() === "academic"
          );
        }
        return (
          String(course.courseType || "")
            .toLowerCase()
            .trim() === section.key
        );
      });

      return {
        categoryName: section.label,
        category: section.label,
        type: "card",
        courses: matchedCourses.slice(0, 10).map((c) => {
          const matchedBatch = allUpcomingBatches.find(
            (b) => b.course.toString() === c._id.toString(),
          );

          return {
            id: c._id,
            title: c.title,
            price: c.price,
            oldPrice: c.oldPrice,
            label: c.label,
            image: c.image,
            details: c.details || {},
            upcomingBatch: matchedBatch || null,
          };
        }),
      };
    });

    // Filter out empty course groups
    const validFixedGroups = fixedGroupedData.filter(
      (group) => group.courses.length > 0,
    );

    res.status(200).json({
      dynamicCategories: updatedCategories,
      courseSections: validFixedGroups,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update course with dynamic courseType control
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const { details, modules, courseType, ...restOfBody } = req.body;
    let updateData = { ...restOfBody };

    if (req.file) {
      updateData.image = req.file.path;
    }

    if (details) {
      const parsedDetails =
        typeof details === "string" ? JSON.parse(details) : details;
      updateData.details = {
        ...course.details,
        ...parsedDetails,
      };
    }

    if (modules) {
      updateData.modules =
        typeof modules === "string" ? JSON.parse(modules) : modules;
    }

    if (courseType) {
      updateData.courseType = String(courseType).toLowerCase().trim();
    }

    const currentSubCategory = updateData.subCategory || course.subCategory;
    const currentCategoryType =
      updateData.courseCategoryType || course.courseCategoryType;

    if (currentCategoryType === "academic") {
      if (currentSubCategory) {
        const Category = require("../models/Category");
        const matchedCategory = await Category.findOne({
          "subCategories._id": currentSubCategory,
        }).lean();
        if (matchedCategory) {
          const targetSub = matchedCategory.subCategories.find(
            (sub) => sub._id.toString() === currentSubCategory.toString(),
          );
          if (targetSub) {
            updateData.price = targetSub.admissionFee || 0;
            updateData.oldPrice = targetSub.oldAdmissionFee || 0;
          }
        }
      } else {
        updateData.price = 0;
        updateData.oldPrice = 0;
      }
      updateData.courseType = "academic";
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    res.status(200).json(updatedCourse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get courses, supports basic filtering
const getCourses = async (req, res) => {
  try {
    let filter = {};

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.subCategory) {
      const subId = req.query.subCategory;
      if (mongoose.Types.ObjectId.isValid(subId)) {
        filter.$or = [
          { subCategory: new mongoose.Types.ObjectId(subId) },
          { subCategory: String(subId) },
        ];
      } else {
        filter.subCategory = subId;
      }
    }

    if (req.query.courseCategoryType) {
      filter.courseCategoryType = req.query.courseCategoryType;
    }
    if (req.query.isFeatured) {
      filter.isFeatured = req.query.isFeatured === "true";
    }

    if (req.query.courseType) {
      filter.courseType = String(req.query.courseType).toLowerCase().trim();
    }

    const limitCount = req.query.limit ? parseInt(req.query.limit) : 0;

    const courses = await Course.find(filter)
      .populate("category", "name image subCategories")
      .populate("instructor", "name email")
      .sort({ createdAt: -1 })
      .limit(limitCount);

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.error("Error in getCourses backend handler:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get teacher's own courses with search/filter
const getTeacherCourses = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { search, courseCategoryType, courseType } = req.query;

    let queryConditions = { instructor: teacherId };

    if (courseCategoryType) {
      queryConditions.courseCategoryType = courseCategoryType;
    }

    if (courseType) {
      queryConditions.courseType = String(courseType).toLowerCase().trim();
    }

    if (search && search.trim() !== "") {
      queryConditions.title = { $regex: search.trim(), $options: "i" };
    }

    const courses = await Course.find(queryConditions)
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a course (auth: instructor or admin)
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this course" });
    }

    await course.deleteOne();
    res
      .status(200)
      .json({ id: req.params.id, message: "Course removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle featured status of a course
const toggleCourseFeatured = async (req, res) => {
  try {
    const { isFeatured } = req.body;
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isFeatured },
      { new: true, runValidators: true },
    );

    if (!course) return res.status(404).json({ message: "Course not found" });

    res.status(200).json({
      success: true,
      message: "Course featured status updated successfully",
      course,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get categories with count of published courses
const getDynamicCategories = async (req, res) => {
  try {
    const categories = await Course.aggregate([
      { $match: { isPublished: true } },
      {
        $group: {
          _id: "$category",
          courseCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      { $unwind: "$categoryDetails" },
      {
        $project: {
          _id: 0,
          name: "$categoryDetails.name",
          courseCount: 1,
        },
      },
      { $sort: { name: 1 } },
    ]);

    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all courses under a specific category name
const getCoursesByCategoryName = async (req, res) => {
  try {
    const { categoryName } = req.params;
    const targetCategory = await Category.findOne({ name: categoryName });
    if (!targetCategory) return res.status(200).json([]);

    const courses = await Course.find({
      category: targetCategory._id,
      isPublished: true,
    }).populate("instructor", "name email");

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCourse,
  getCourses,
  getTeacherCourses,
  updateCourse,
  deleteCourse,
  toggleCourseFeatured,
  getEducationPageData,
  getDynamicCategories,
  getCoursesByCategoryName,
};
