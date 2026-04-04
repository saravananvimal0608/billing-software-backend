import cron from "node-cron";
import Shop from "../model/shopModel.js";
import { enforceUserLimit } from "../controller/shopController.js";

export const runPlanExpiryNow = async () => {
  console.log("Running manual expiry check...");

  const today = new Date();

  const expiredShops = await Shop.find({
    subscriptionExpiry: { $lt: today },
  });

  await Promise.all(
    expiredShops.map(async (shop) => {
      let updateData = {};
      let finalPlan = shop.subscriptionPlan;

      // CASE 1: Renewal
      if (shop.stayCurrentPlan) {
        const newStart = new Date();
        const newExpiry = new Date();
        newExpiry.setMonth(newExpiry.getMonth() + 1);

        updateData = {
          subscriptionStartDate: newStart,
          subscriptionExpiry: newExpiry,
          stayCurrentPlan: false,
        };

        finalPlan = shop.subscriptionPlan;
      }

      // CASE 2: nextPlan → upgrade
      else if (shop.nextPlan) {
        const newStart = new Date();
        const newExpiry = new Date();
        newExpiry.setMonth(newExpiry.getMonth() + 1);

        updateData = {
          subscriptionPlan: shop.nextPlan,
          subscriptionStartDate: newStart,
          subscriptionExpiry: newExpiry,
          nextPlan: null,
        };

        finalPlan = shop.nextPlan;
      }

      // CASE 3: fallback → Basic
      else {
        updateData = {
          subscriptionPlan: "Basic",
          subscriptionStartDate: null,
          subscriptionExpiry: null,
        };

        finalPlan = "Basic";
      }

      const updatedShop = await Shop.findByIdAndUpdate(
        shop._id,
        { $set: updateData }, // 🔥 important
        { new: true }, // 🔥 important
      );

      console.log("UPDATED:", updatedShop.subscriptionPlan);

      await enforceUserLimit(shop._id, finalPlan);
    }),
  );
  console.log("Manual expiry done");
};

const planExpiryJob = () => {
  cron.schedule("0 */12 * * *", async () => {
    console.log("Running cron expiry check...");
    await runPlanExpiryNow();
  });
};

export default planExpiryJob;
