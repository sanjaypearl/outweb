import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppDataSource } from "../../config/db.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

import { User } from "../../model/usertable.js";
import { AgreementForm } from "../../model/FormTable.js";

import { UserFormResponse } from "../../model/userform_response_table.js";
const formRepo = AppDataSource.getRepository(AgreementForm);
const userFormResponseRepo = AppDataSource.getRepository(UserFormResponse);
const userRepo = AppDataSource.getRepository(User);
import { generatePdfFromResponses } from "../../utils/pdfGenerator.js";
import { sendPDFForSignature } from "../../utils/docusignUploader.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createForm = asyncHandler(async (req, res, next) => {
  const { parts, name, termsAndConditions } = req.body;

  // console.log("the data from the body is", data)
  const formData = {
    parts: parts,
    name: name,
    termsAndConditions: termsAndConditions,
  };
  const parsedData = JSON.stringify(formData);
  const form = formRepo.create({
    name,
    data: parsedData,
  });
  const savedForm = await formRepo.save(form);
  console.log("the saved form is", savedForm);
  return res.status(201).json({
    message: "Form Created Successfully",
    data: savedForm,
    success: true,
  });
});

export const getAllForm = asyncHandler(async (req, res, next) => {
  try {
    const data = await formRepo.find();
    if (!data) {
      return res.status(404).json({
        message: "No Form found",
        success: false,
      });
    }
    return res.status(200).json({
      message: "Forms Returned",
      success: true,
      data: data,
    });
  } catch (error) {
    next(error);
  }
});

export const get_assigned_form_to_user = asyncHandler(async (req, res) => {
  try {
    const { assignedUserId } = req.params;

    if (!assignedUserId) {
      return res.status(400).json({
        message: "Bad user id",
        success: false,
      });
    }

    // Query forms where data CLOB JSON contains assignedUserId
    const forms = await userFormResponseRepo
      .createQueryBuilder("form")
      .where("JSON_VALUE(form.data, '$.assignedUserId') = :assignedUserId", {
        assignedUserId,
      })
      .getMany();

    if (!forms || forms.length === 0) {
      return res.status(404).json({
        message: "No forms found for this user",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Forms assigned to user fetched successfully",
      data: forms,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching assigned forms:", error);

    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
});

/** Save user response in this */
export const save_user_form_response = asyncHandler(async (req, res, next) => {
  const { userId, formId, responses } = req.body;

  if (!userId || !formId || !responses) {
    return res.status(400).json({ message: "Missing userId, formId, or responses" });
  }

  console.log("Received responses:", responses);

  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) return res.status(404).json({ message: "User not found" });

  const form = await formRepo.findOne({ where: { id: formId } });
  if (!form) return res.status(404).json({ message: "Form not found" });

  console.log("Form is:", form);

  let parsedResponses, formData;
  try {
    parsedResponses = typeof responses === "string" ? JSON.parse(responses) : responses;
    formData = JSON.parse(form.data);
  } catch (err) {
    return res.status(400).json({
      message: "Invalid responses or form data",
      error: err.message,
    });
  }

  // Validate structure: must have parts
  if (!parsedResponses.parts || !Array.isArray(parsedResponses.parts)) {
    return res.status(400).json({ message: "Invalid response format: parts array required" });
  }

  const labeledResponses = {};
  const fieldRefs = new Set();

  // Recursive function to process parts & subParts
  const processPart = (part, formPart) => {
    // Process fields
    part.fields?.forEach((respField) => {
      const formField = formPart.fields?.find((f) => f.ref === respField.ref);
      if (formField) {
        fieldRefs.add(respField.ref);
        labeledResponses[formField.label] = respField.value ?? null;
      }
    });

    // Process subParts
    part.subParts?.forEach((subResp) => {
      const matchingSubPart = formPart.subParts?.find((sp) => sp.subPartName === subResp.subPartName);
      if (matchingSubPart) {
        subResp.fields?.forEach((respField) => {
          const formField = matchingSubPart.fields?.find((f) => f.ref === respField.ref);
          if (formField) {
            fieldRefs.add(respField.ref);
            labeledResponses[formField.label] = respField.value ?? null;
          }
        });
      }
    });
  };

  // Process all parts
  parsedResponses.parts.forEach((respPart) => {
    const formPart = formData.parts.find((p) => p.partName === respPart.partName);
    if (formPart) processPart(respPart, formPart);
  });

  // Validate refs
  const allResponseRefs = [];
  parsedResponses.parts.forEach((p) => {
    p.fields?.forEach((f) => allResponseRefs.push(f.ref));
    p.subParts?.forEach((sp) => sp.fields?.forEach((f) => allResponseRefs.push(f.ref)));
  });

  const invalidRefs = allResponseRefs.filter((r) => !fieldRefs.has(r));
  if (invalidRefs.length > 0) {
    return res.status(400).json({
      message: `Invalid response refs: ${invalidRefs.join(", ")}`,
    });
  }

  // Save response
  const newResponse = userFormResponseRepo.create({
    user,
    form,
    responses: JSON.stringify(parsedResponses), // full structured response
    labeledResponses: JSON.stringify(labeledResponses), // flat labels for search/reporting
  });

  const savedResponse = await userFormResponseRepo.save(newResponse);

  if (!savedResponse) {
    return res.status(500).json({
      message: "Failed to save the response data",
      success: false,
      data: null,
    });
  }

  // Ensure pdfs directory exists
  const pdfDir = path.join(process.cwd(), "pdfs");
  try {
    await fs.mkdir(pdfDir, { recursive: true });
    console.log("✅ pdfs directory is ready:", pdfDir);
  } catch (err) {
    console.error("❌ Failed to create pdfs directory:", err);
    return res.status(500).json({ message: "Failed to create PDF directory" });
  }

  // Generate PDF
  const pdfFileName = `FormResponse_${savedResponse.id}.pdf`;
  const pdfPath = path.join(pdfDir, pdfFileName);
  try {
    await generatePdfFromResponses(parsedResponses, pdfPath);
    console.log("✅ PDF generated at:", pdfPath);
  } catch (err) {
    console.error("❌ Failed to generate or send PDF:", err);
  }

  res.status(201).json({
    message: "Response submitted successfully",
    success: true,
    response: {
      ...savedResponse,
      labeledResponses,
    },
  });
});


/** MOHAN ASSIGNMENT */
export const assignUserToForm = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // Find the form by id first
    const existForm = await formRepo.findOne({ where: { id } });

    if (!existForm) {
      return res
        .status(404)
        .json({ message: "Form not found", success: false });
    }

    // Update assignedUserId
    existForm.assignedUserId = userId;

    // Save the updated form entity
    const updatedForm = await formRepo.save(existForm);

    return res.status(200).json({
      message: "Form updated successfully",
      data: updatedForm,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
});

export const deleteForm = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const form = await formRepo.findOne({ where: { id } });

  if (!form) {
    return res.status(404).json({
      success: false,
      message: "Form not found",
    });
  }

  await formRepo.remove(form);

  return res.status(200).json({
    message: "Form deleted successfully",
    success: true,
  });
});
