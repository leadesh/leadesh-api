import { Router } from "express";
import { addSubscriptionPlan, deleteSubscriptionPlan, subscribeToPlan, subscriptionPlans } from '../controllers/subscription.controller';
const router = Router();

router
  .route("/")
  .get(subscriptionPlans)
  .delete(deleteSubscriptionPlan);
  
router.route("/subscribe/:id").post(subscribeToPlan)
router.route("/plan-add").post(addSubscriptionPlan);

export default router;
