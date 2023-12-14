import { Router } from "express";
import {
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  deleteUser,
  getUser,
  handleKeywords,
  fetchUserKeywords,
  handleKeyword,
  deleteKeyword,
} from "../controllers/user.controllers.js";

const router = Router();

router
  .route("/")
  .get(getUserProfile)
  .put(updateUserProfile)
  .delete(deleteUser);
router.route("/getUser/:id").get(getUser);
router.route("/password").post(changeUserPassword);
router.route("/keywords").get(fetchUserKeywords).post(handleKeywords);
router.route("/keywords/:id").post(handleKeyword).delete(deleteKeyword);

export default router;
