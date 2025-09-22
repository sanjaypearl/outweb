import { Router } from "express";
import userRoutes from "./user.route.js"; // Import user-related routes
import authRouter from "./auth.route.js";

const routes = Router();

routes.use("/users", userRoutes);

routes.use("/auth", authRouter);

export default routes;
