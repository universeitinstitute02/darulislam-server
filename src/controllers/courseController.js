const Course = require("../models/Course");
const Category = require("../models/Category");

const createCourse = async (req, res) => {
  try {
    const {
      title,
      category,
      subCategory,
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
      parsedDetails = typeof details === "string" ? JSON.parse(details) : details;
    }

    let parsedModules = [];
    if (modules) {
      parsedModules = typeof modules === "string" ? JSON.parse(modules) : modules;
    }

    const course = await Course.create({
      title,
      image: req.file.path,
      category,
      subCategory,
      instructor: req.user._id,
      duration,
      courseType,
      price: price || 0,
      oldPrice: oldPrice || 0,
      label: label || "",
      modules: parsedModules,
      details: parsedDetails,
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCourses = async (req, res) => {
  try {
    let filter = { isPublished: true };

    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.subCategory) {
      filter.subCategory = req.query.subCategory;
    }
    if (req.query.isFeatured) {
      filter.isFeatured = req.query.isFeatured === "true";
    }

    const limitCount = req.query.limit ? parseInt(req.query.limit) : 0;

    const courses = await Course.find(filter)
      .populate("category", "name image")
      .populate("instructor", "name email")
      .sort({ createdAt: -1 })
      .limit(limitCount);

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEducationPageData = async (req, res) => {
  try {
    const fixedCategories = [
      "একাডেমিক কোর্স সমূহ",
      "বান্ডেল কোর্স সমূহ",
      "দরসি কিতাব কোর্স সমূহ",
      "প্রিমিয়াম কোর্স সমূহ",
    ];

    const groupedData = await Promise.all(
      fixedCategories.map(async (catName) => {
        const targetCategory = await Category.findOne({ name: catName });
        if (!targetCategory)
          return { category: catName, type: "card", courses: [] };

        const courses = await Course.find({
          category: targetCategory._id,
          isPublished: true,
        })
          .select("title image price oldPrice label details")
          .sort({ createdAt: -1 })
          .limit(10);

        return {
          category: catName,
          type: "card",
          courses: courses.map((c) => ({
            id: c._id,
            title: c.title,
            price: c.price,
            oldPrice: c.oldPrice,
            label: c.label,
            image: c.image,
            details: c.details || {},
          })),
        };
      }),
    );

    const filteredData = groupedData.filter(
      (group) => group.courses.length > 0,
    );

    res.status(200).json(filteredData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTeacherCourses = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id })
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const { details, modules, ...restOfBody } = req.body;
    let updateData = { ...restOfBody };

    if (req.file) {
      updateData.image = req.file.path;
    }

    if (details) {
      const parsedDetails = typeof details === "string" ? JSON.parse(details) : details;
      updateData.details = {
        ...course.details,
        ...parsedDetails,
      };
    }

    if (modules) {
      updateData.modules = typeof modules === "string" ? JSON.parse(modules) : modules;
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

const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

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

const toggleCourseFeatured = async (req, res) => {
  try {
    const { isFeatured } = req.body;

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isFeatured },
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({
      success: true,
      message: "Course featured status updated successfully",
      course,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
      {
        $sort: { name: 1 },
      },
    ]);

    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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