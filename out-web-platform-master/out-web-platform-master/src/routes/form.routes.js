import express from "express";
import {
  createForm,
  getAllForm,
  assignUserToForm,
  get_assigned_form_to_user,
  save_user_form_response,
} from "../controller/form.controller.js";
import {
  assign_form_to_user,
  get_user_forms,
  list_docusign_envelopes,
} from "../controller/admin.controller.js";
import { getDocument } from "../../utils/docusignUploader.js";
const router = express.Router();

router.route(`/`).post(createForm).get(getAllForm);
router.route(`/envelopes`).get(list_docusign_envelopes);
router.route(`/documents/:envelopeId/:documentId`).get(getDocument)
// router.put(`/:id`, assignUserToForm)

router.get(`/:assignedUserId`, get_user_forms);

router.route(`/assign`).post(assign_form_to_user);
router.route(`/submitresponse`).post(save_user_form_response)
export default router;
