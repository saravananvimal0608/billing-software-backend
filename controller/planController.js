import Plan from "../model/plansModel.js";

// ADD PLAN
export const addPlan = async (req, res) => {
  try {
    const { planName, amount, validity, benefits, planBtn } = req.body;

    if (!planName || !amount || !planBtn || !validity || !benefits) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const newPlan = new Plan({
      planName,
      amount,
      validity,
      benefits,
      planBtn,
    });

    await newPlan.save();

    res.status(201).json({
      message: "Plan created successfully",
      data: newPlan,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  GET ALL PLANS
export const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ createdAt: -1 });

    res.status(200).json({
      message: "Plans fetched",
      data: plans,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  GET SINGLE PLAN
export const getSinglePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.status(200).json({
      data: plan,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  UPDATE PLAN
export const updatePlan = async (req, res) => {
  try {
    const updatedPlan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updatedPlan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.status(200).json({
      message: "Plan updated successfully",
      data: updatedPlan,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  DELETE PLAN
export const deletePlan = async (req, res) => {
  try {
    const deletedPlan = await Plan.findByIdAndDelete(req.params.id);

    if (!deletedPlan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.status(200).json({
      message: "Plan deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
