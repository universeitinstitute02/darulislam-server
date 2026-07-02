const Batch = require("../models/Batch");
const Course = require("../models/Course");

/// Create a new Batch (Admin)
const createBatch = async (req, res) => {
  try {
    const {
      course,
      teacher,
      batchName,
      maxSeats,
      status,
      admissionStartDate,
      classStartDate,
    } = req.body;

    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({ message: "Linked course not found" });
    }

    const batch = await Batch.create({
      course,
      teacher: teacher || null,
      batchName,
      maxSeats,
      status: status || "upcoming",
      admissionStartDate: admissionStartDate || null, // 🎯
      classStartDate: classStartDate || null, // 🎯
      availableSeats: maxSeats || 30,
    });

    res.status(201).json({
      success: true,
      message: "Batch created successfully",
      data: batch,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Batch Details (Admin)
const updateBatch = async (req, res) => {
  try {
    const {
      batchName,
      teacher,
      maxSeats,
      status,
      admissionStartDate,
      classStartDate,
    } = req.body;

    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    if (batchName) batch.batchName = batchName;
    if (maxSeats) batch.maxSeats = maxSeats;
    if (status) batch.status = status;
    if (admissionStartDate !== undefined)
      batch.admissionStartDate = admissionStartDate; // 🎯
    if (classStartDate !== undefined) batch.classStartDate = classStartDate; // 🎯
    if (teacher !== undefined) batch.teacher = teacher;

    await batch.save();

    res.status(200).json({
      success: true,
      message: "Batch configuration updated successfully",
      data: batch,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all Batches with filtering (Admin)
const getAllBatches = async (req, res) => {
  try {
    const { course, teacher, status } = req.query;
    let query = {};

    if (course) query.course = course;
    if (teacher) query.teacher = teacher;
    if (status) query.status = status;

    const batches = await Batch.find(query)
      .populate("course", "title price image")
      .populate("teacher", "name email profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: batches.length,
      data: batches,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Single Batch Details (Admin)
const getBatchById = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate("course", "title modules details")
      .populate("teacher", "name email profileImage")
      .populate("enrolledStudents", "name email profileImage");

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    res.status(200).json({
      success: true,
      data: batch,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a Batch (Admin)
const deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    // Protection logic: Block deletion if students have already paid and locked into this roster
    if (batch.enrolledStudents.length > 0) {
      return res.status(400).json({
        message:
          "Cannot delete a batch that already has active enrolled students. Migrate users first.",
      });
    }

    await batch.deleteOne();

    res.status(200).json({
      success: true,
      message: "Batch removed successfully from tracking registry",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBatch,
  getAllBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
};
