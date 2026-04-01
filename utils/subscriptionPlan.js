import Shop from "../model/shopModel.js";

export const subscriptionPlan = async (role, shopId) => {
  try {
    if (role !== "admin") {
      return null;
    }
    const shop = await Shop.findById(shopId);

    if (!shop) {
      return null;
    }
    

    if (shop.subscriptionPlan === "Basic" || shop.subscriptionPlan === "Pro" || shop.subscriptionPlan === "Premium") {
      return shop.subscriptionPlan;
    }
    return null;
  } catch (error) {
    console.log("subscription plan", error);
    return null;
  }
};
