const Category = require("../models/Category");

const getCategories = async (req, res) => {
  try {
    const categories = await Category.aggregate([
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
    const { name, description, isActive, subCategories } = req.body;

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
        formattedSubCategories = parsedSub.map((sub) =>
          typeof sub === "string" ? { name: sub } : sub,
        );
      }
    }

    const category = await Category.create({
      name,
      image: imageUrl,
      description,
      isActive: isActive === "false" ? false : true,
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

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    res.status(200).json(updatedCategory);
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

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
