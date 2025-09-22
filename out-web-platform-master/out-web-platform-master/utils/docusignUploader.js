import docusign from "docusign-esign";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pLimit from 'p-limit';

// Load environment variables
dotenv.config();

// ES Module __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate environment variables once at startup
const requiredEnv = ["DOCUSIGN_INTEGRATOR_KEY", "DOCUSIGN_USER_ID", "DOCUSIGN_ACCOUNT_ID"];
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
});

const integratorKey = process.env.DOCUSIGN_INTEGRATOR_KEY.trim();
const userId = process.env.DOCUSIGN_USER_ID.trim();
const accountId = process.env.DOCUSIGN_ACCOUNT_ID.trim();
const basePath = "https://demo.docusign.net/restapi";
const privateKeyPath = path.join(__dirname, "../config/docusign_private_key.pem");
const BASE_API_URL = "http://localhost:4000/api/v1/form";

// Cache private key to avoid reading multiple times
let cachedPrivateKey = null;
async function getPrivateKey() {
  if (cachedPrivateKey) return cachedPrivateKey;
  try {
    cachedPrivateKey = await fs.readFile(privateKeyPath);
    return cachedPrivateKey;
  } catch {
    throw new Error(`Private key file not found at ${privateKeyPath}`);
  }
}

// Authenticate and return ApiClient
async function authenticate() {
  const privateKey = await getPrivateKey();
  const apiClient = new docusign.ApiClient();
  apiClient.setBasePath(basePath);

  const results = await apiClient.requestJWTUserToken(
    integratorKey,
    userId,
    "signature",
    privateKey,
    3600
  );

  const accessToken = results.body.access_token;
  apiClient.addDefaultHeader("Authorization", `Bearer ${accessToken}`);

  return apiClient;
}

// Send PDF for signature
export async function sendPDFForSignature(pdfFilePath, recipientEmail, recipientName) {
  try {
    const pdfBytes = await fs.readFile(pdfFilePath);
    const pdfBase64 = pdfBytes.toString("base64");

    const apiClient = await authenticate();
    const envelopesApi = new docusign.EnvelopesApi(apiClient);

    const envelopeDefinition = {
      emailSubject: "Please sign this document",
      documents: [
        {
          documentBase64: pdfBase64,
          name: path.basename(pdfFilePath),
          fileExtension: "pdf",
          documentId: "1",
        },
      ],
      recipients: {
        signers: [
          {
            email: recipientEmail,
            name: recipientName,
            recipientId: "1",
            routingOrder: "1",
            tabs: {
              signHereTabs: [
                {
                  documentId: "1",
                  pageNumber: "1",
                  xPosition: "100",
                  yPosition: "150",
                },
              ],
            },
          },
        ],
      },
      status: "sent",
    };

    const { envelopeId } = await envelopesApi.createEnvelope(accountId, { envelopeDefinition });
    return envelopeId;
  } catch (error) {
    console.error("Error sending PDF for signature:", error);
    throw error;
  }
}

export async function listSentEnvelopes(filters = {}) {
  try {
    const apiClient = await authenticate();
    const envelopesApi = new docusign.EnvelopesApi(apiClient);

    const options = {
      fromDate: filters.fromDate
        ? filters.fromDate.toISOString()
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      toDate: filters.toDate
        ? filters.toDate.toISOString()
        : new Date().toISOString(),
    };
    if (filters.status) options.status = filters.status;
    if (filters.search) options.searchText = filters.search;

    const { envelopes = [] } = await envelopesApi.listStatusChanges(accountId, options);

    const limit = pLimit(5); // Run max 5 concurrent requests at a time

    const envelopesWithDocs = await Promise.all(
      envelopes.map((envelope) =>
        limit(async () => {
          try {
            const docsResponse = await envelopesApi.listDocuments(accountId, envelope.envelopeId);
            const documents = docsResponse.envelopeDocuments.map((doc) => ({
              documentId: doc.documentId,
              name: doc.name,
              type: doc.type,
              url: `${BASE_API_URL}/documents/${envelope.envelopeId}/${doc.documentId}`,
            }));
            return {
              envelopeId: envelope.envelopeId,
              subject: envelope.emailSubject,
              status: envelope.status,
              sentDate: envelope.sentDateTime,
              documents,
            };
          } catch (docError) {
            console.error(`Error fetching documents for envelope ${envelope.envelopeId}:`, docError);
            return {
              envelopeId: envelope.envelopeId,
              subject: envelope.emailSubject,
              status: envelope.status,
              sentDate: envelope.sentDateTime,
              documents: [],
            };
          }
        })
      )
    );

    return {
      message: "DocuSign envelopes fetched successfully",
      envelopes: envelopesWithDocs,
    };
  } catch (error) {
    console.error("Error listing sent envelopes:", error);
    throw new Error("Failed to list sent envelopes");
  }
}

// Get document for download
export const getDocument = async (req, res) => {
  const { envelopeId, documentId } = req.params;
  try {
    const apiClient = await authenticate();
    const envelopesApi = new docusign.EnvelopesApi(apiClient);

    const document = await envelopesApi.getDocument(accountId, envelopeId, documentId);

    res.setHeader("Content-Type", "application/pdf");
    res.send(document);
  } catch (error) {
    console.error(`Error fetching document ${documentId} from envelope ${envelopeId}:`, error);
    res.status(500).json({ message: "Failed to fetch document", error: error.message });
  }
};
