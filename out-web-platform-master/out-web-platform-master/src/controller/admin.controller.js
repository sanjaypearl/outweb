import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppDataSource } from "../../config/db.js";
import { AgreementForm } from "../../model/FormTable.js";
import { User } from "../../model/usertable.js";
import { listSentEnvelopes } from "../../utils/docusignUploader.js";
const formRepo = AppDataSource.getRepository(AgreementForm);
const userRepo = AppDataSource.getRepository(User);

export const assign_form_to_user = asyncHandler(async (req, res, next) => {
  const { userId, formId } = req.body;
  const user = await userRepo.findOne({
    where: {
      id: userId,
    },
    relations: ["forms"],
  });
  if (!user)
    return res.status(404).json({
      message: "User not found",
    });

  const form = await formRepo.findOne({
    where: {
      id: formId,
    },
  });
  if (!form)
    return res.status(404).json({
      message: "Form not found",
    });

  user.forms.push(form);
  const val = await userRepo.save(user);

  res.status(200).json({
    message: "Form assigned to user successfully",
    // user,
    val,
  });
});
export const get_user_forms = asyncHandler(async (req, res, next) => {
  const userId = req.params.assignedUserId;
  console.log("the usser id", userId);

  // Fetch user with assigned forms
  const user = await userRepo.findOne({
    where: {
      id: userId,
    },
    relations: ["forms"],
  });

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  const forms = user.forms.map((form) => {
    let parsedData = [];
    try {
      parsedData = JSON.parse(form.data);
    } catch (err) {
      parsedData = [];
    }

    return {
      id: form.id,
      name: form?.name,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      fields: parsedData,
    };
  });

  res.status(200).json({
    message: "Forms fetched successfully",
    forms: forms,
  });
});


// Controller to handle HTTP requests
export const list_docusign_envelopes = asyncHandler(async (req, res, next) => {
  try {
    // Extract query parameters for filtering
    const { status, fromDate, toDate, search } = req.query;

    // Build filter object with optional filters
    const filters = {};
    if (status) filters.status = status; // e.g., 'sent', 'completed', 'voided'
    if (fromDate) {
      const parsedFromDate = new Date(fromDate);
      if (isNaN(parsedFromDate)) {
        return res.status(400).json({
          message: "Invalid fromDate parameter. Must be a valid date (e.g., '2023-01-01').",
        });
      }
      filters.fromDate = parsedFromDate;
    }
    if (toDate) {
      const parsedToDate = new Date(toDate);
      if (isNaN(parsedToDate)) {
        return res.status(400).json({
          message: "Invalid toDate parameter. Must be a valid date (e.g., '2023-12-31').",
        });
      }
      filters.toDate = parsedToDate;
    }
    if (search) filters.search = search; // e.g., recipient email or name

    const envelopes = await listSentEnvelopes(filters);
    res.status(200).json(envelopes);
  } catch (error) {
    console.error("Error in list_docusign_envelopes controller:", error);
    res.status(500).json({
      message: "Failed to fetch DocuSign envelopes",
      error: error.message || "Internal Server Error",
    });
  }
});
