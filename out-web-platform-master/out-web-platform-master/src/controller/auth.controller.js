import express from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { User } from "../../model/usertable.js";
import { AppDataSource } from "../../config/db.js";
import bcryptjs from "bcryptjs";
import { generateToken, sendTokenInCookie } from "../../utils/generateToken.js";

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: "username or password is missing",
      success: false,
    });
  }

  const userRepository = AppDataSource.getRepository(User);
  const requestedUser = await userRepository.findOne({ where: { username } });

  if (!requestedUser) {
    return res.status(404).json({
      message: "User not found",
      success: false,
    });
  }

  const match = await bcryptjs.compare(password, requestedUser.password);

  if (!match) {
    return res.status(401).json({
      message: "Incorrect username or password",
      success: false,
    });
  }

  // ✅ Safe to login
  requestedUser.password = undefined;

  const token = generateToken(requestedUser, {
    expiresIn: "3d",
    algorithm: "HS256",
  });

  sendTokenInCookie(res, token);

  if (!requestedUser.is_active) {
    return res.status(200).json({
      message: "Your account is inactive. Please change your password first.",
      redirectTo: "/change-password",
      success: true,
    });
  }

  console.log("Password matched successfully");
  return res.status(200).json({
    message: "Login successful",
    success: true,
    data: requestedUser,
  });
});

export const changePasswordAndActivateUser = asyncHandler(async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;

  if (!username || !oldPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Username, old password, and new password are required",
    });
  }

  const userRepository = AppDataSource.getRepository(User);

  const user = await userRepository.findOne({ where: { username } });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Verify old password
  const isMatch = await bcryptjs.compare(oldPassword, user.password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Old password is incorrect",
    });
  }

  // Hash new password
  const hashedPassword = await bcryptjs.hash(newPassword, 10);

  // Update password + activate user
  user.password = hashedPassword;
  user.is_active = 1;

  await userRepository.save(user);

  res.status(200).json({
    success: true,
    message: "Password changed successfully. User is now active.",
  });
});
