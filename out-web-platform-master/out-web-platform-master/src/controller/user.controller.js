import { asyncHandler } from "../../utils/asyncHandler.js";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../../config/db.js";
import { User } from "../../model/usertable.js";
import { sendEmail } from "../../utils/email.js";

export const createUser = asyncHandler(async (req, res) => {
  console.log(req.body);
  const { name, username, password } = req.body;

  if (!name || !username || !password) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  const userRepository = AppDataSource.getRepository(User);

  const existingUser = await userRepository.findOne({ where: { username } });
  if (existingUser) {
    res.status(400);
    throw new Error("Username already exists");
  }

  // hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  const data = {
    username,
    tempPassword: password, // match template variable
    resetLink: "http://localhost/login", // pass actual link
  };

  await sendEmail(
    username,
    "Account activation email",
    "userCreateEmailToClient",
    data
  );

  const user = userRepository.create({
    name,
    username,
    password: hashedPassword,
    role: "USER",
    is_active: 0,
  });

  await userRepository.save(user);

  res.status(201).json({
    success: true,
    message: "User created successfully",
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      is_active: user.is_active,
    },
  });
});

//  Get all users

export const getUsers = asyncHandler(async (req, res) => {
  const userRepository = AppDataSource.getRepository(User);

  const users = await userRepository.find({
    select: ["id", "name", "username", "role", "is_active", "created_at"],
  });

  if (!users || users.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No users found",
    });
  }

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

// Get all users with relations
// Get all users with relations

// export const getUsers = asyncHandler(async (req, res) => {
//   try {
//     const userRepository = AppDataSource.getRepository(User);

//     const users = await userRepository.find({
//       relations: [
//         "forms",      // many-to-many forms
//         "responses",  // one-to-many responses
//       ],
//     });

//     if (!users || users.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No users found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       count: users.length,
//       data: users,
//     });
//   } catch (error) {
//     console.error("Error fetching users:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message,
//     });
//   }
// });

export const deleteUser = asyncHandler(async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(404).json({
      message: " user name is required",
      success: "false",
    });
  }

  const userRepository = AppDataSource.getRepository(User);

  const user = await userRepository.findOne({ where: { username } });
  if (!user) {
    return res.status(404).json({
      message: " user not found",
      success: "false",
    });
  }

  const deletedUser = await userRepository.delete({ username: username });

  if (!deletedUser) {
    res.status(400);
    throw new Error(" user not exist ");
  }

  return res.status(200).json({
    message: "user deleted successfully",
    success: true,
    data: deleteUser,
  });
});
