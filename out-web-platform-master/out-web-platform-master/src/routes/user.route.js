import express from "express";
import {
  createUser,
  deleteUser,
  getUsers,
} from "../controller/user.controller.js";
import protectRoute from "../../middleware/protectRoute.js";

const userRoutes = express.Router();

// Apply middleware per-method
userRoutes
  .route("/")
  .post(protectRoute("ADMIN"), createUser)
  .get(getUsers)
  // .get(protectRoute("ADMIN"), getUsers)
  .delete(protectRoute("ADMIN"), deleteUser);

export default userRoutes;
