import express from "express";
import {
  changePasswordAndActivateUser,
  login,
} from "../controller/auth.controller.js";
import protectRoute from "../../middleware/protectRoute.js";

const authRouter = express.Router();

authRouter.route("/").post(login);
authRouter
  .route("/change-password")
  .post(protectRoute(["USER", "ADMIN"]), changePasswordAndActivateUser);

export default authRouter;
