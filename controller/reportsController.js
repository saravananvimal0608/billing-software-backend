import Report from "../model/reportModel.js";

export const addReport = async (req, res) => {
  const { subject, description } = req.body;
  const shopId = req.user.shopId;

  try {
    if (!subject || !description) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }

    const newReport = new Report({
      subject,
      description,
      shopId,
    });

    await newReport.save();
    return res
      .status(200)
      .json({ message: "Report added successfully", data: newReport });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: error.stack,
    });
  }
};

export const getAllReports = async (req, res) => {
  const shopId = req.user.shopId;

  const page = parseInt(req.query.page) || 1;

  const limit = 5;

  const skip = (page - 1) * limit;

  const search = req.query.search || "";

  const query = {
    shopId: shopId,
    subject: { $regex: search, $options: "i" },
  };

  try {
    const reports = await Report.find(query).skip(skip).limit(limit);

    const totalReport = await Report.countDocuments(query);

    if (reports.length === 0) {
      return res.status(200).json({ message: "No reports found", data: [] });
    }

    return res
      .status(200)
      .json({ message: "Reports fetched successfully", data: reports , currentPage : page, totalPages: Math.ceil(totalReport / limit)});

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: error.stack,
    });
  }
};

export const getAllReportsForSuperAdmin = async (req, res) => {
  try {
    const reports = await Report.find();

    if (reports.length === 0) {
      return res.status(200).json({ message: "No reports found", data: [] });
    }

    return res
      .status(200)
      .json({ message: "Reports fetched successfully", data: reports });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: error.stack,
    });
  }
};

export const updateReport = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const shopId = req.user.shopId;

  try {
    if (!["pending", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updatedReport = await Report.findOneAndUpdate(
      { _id: id, shopId },
      { status },
      { new: true },
    );

    if (!updatedReport) {
      return res.status(404).json({ message: "Report not found" });
    }

    return res.status(200).json({
      message: "Report updated successfully",
      data: updatedReport,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: error.stack,
    });
  }
};
