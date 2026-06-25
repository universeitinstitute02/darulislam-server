const Testimonial = require("../models/Testimonial");

// Create Testimonial (User/Public Submission)
const createTestimonial = async (req, res) => {
  try {
    const { text, rating, userType } = req.body;

    // 🎯 multer-এর 'upload.single' থেকে অপশনাল ইমেজ ফাইল রিসিভ করার মেকানিজম
    let identityImage = null;
    if (req.file) {
      // যদি আপনি ক্লাউডিনারি ব্যবহার করেন তবে req.file.path হবে, লোকাল স্টোরেজ হলে req.file.filename বা custom path
      identityImage = req.file.path || req.file.filename;
    }

    const testimonial = await Testimonial.create({
      user: req.user._id,
      text,
      rating,
      userType: userType || "student", // Default falls back to student
      identityImage,
    });

    res.status(201).json({ success: true, data: testimonial });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Approved Testimonials with Query Filters (Public Dedicated Page)
const getPublicTestimonials = async (req, res) => {
  try {
    const { userType, rating } = req.query;

    // strictly filter for approved items
    const queryCondition = { isApproved: true };

    // 🎯 ডাইনামিক কুয়েরি ফিল্টার লক (শিক্ষার্থী, ওস্তাদ, ওস্তাদা, অভিভাবক এর জন্য)
    if (userType) {
      queryCondition.userType = userType;
    }
    if (rating) {
      queryCondition.rating = Number(rating);
    }

    const testimonials = await Testimonial.find(queryCondition)
      .populate("user", "name profileImage")
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({ success: true, data: testimonials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Testimonials with Server Side Filters (Admin Control Panel)
const getAdminTestimonials = async (req, res) => {
  try {
    const { userType, isApproved } = req.query;
    const queryCondition = {};

    if (userType) queryCondition.userType = userType;
    if (isApproved) queryCondition.isApproved = isApproved === "true";

    const testimonials = await Testimonial.find(queryCondition)
      .populate("user", "name email role phone")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: testimonials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Testimonial Status (Admin)
const updateApprovalStatus = async (req, res) => {
  try {
    const { isApproved } = req.body;

    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { new: true, runValidators: true },
    );

    if (!testimonial) {
      return res
        .status(404)
        .json({ success: false, message: "Testimonial not found" });
    }

    res.status(200).json({ success: true, data: testimonial });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE Testimonial (Admin)
const deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res
        .status(404)
        .json({ success: false, message: "Testimonial not found" });
    }

    await testimonial.deleteOne();
    res
      .status(200)
      .json({ success: true, message: "Testimonial removed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTestimonial,
  getPublicTestimonials,
  getAdminTestimonials,
  updateApprovalStatus,
  deleteTestimonial,
};