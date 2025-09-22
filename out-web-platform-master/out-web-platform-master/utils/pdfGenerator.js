import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";

/**
 * Generate PDF from labeled responses using HTML rendering
 * @param {Object} labeledResponses - structured form responses
 * @param {String} outputPath - path to save PDF
 */
export const generatePdfFromResponses = async (labeledResponses, outputPath) => {
  try {
    // Build HTML string
    const buildHtml = (responses) => {
      let html = `
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: black; }
              h2 { color: black; margin-top: 30px; }
              p, li { color: #4a5568; }
              .field-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              .field-table th, .field-table td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
              .field-table th { background-color: #edf2f7; font-weight: bold; }
              .label { font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Supplier Agreement Form</h1>
      `;

      // Terms & Conditions
      if (responses.termsAndConditions) {
        html += `<h2>Form Terms & Conditions</h2>`;
        html += `<div>${responses.termsAndConditions}</div>`;
      }

      // Parts
      responses.parts?.forEach((part, partIndex) => {
        html += `<h2>${part.partName}</h2>`;
        if (part.termsAndConditions) html += `<div>${part.termsAndConditions}</div>`;

        // Fields in a 4-column table
        if (part.fields?.length) {
          html += `<table class="field-table">`;
          html += `<tr><th>Field</th><th>Value</th><th>Field</th><th>Value</th></tr>`;
          let fieldsHtml = '';
          part.fields.forEach((field, index) => {
            if (index % 2 === 0) {
              fieldsHtml += `<tr>`;
            }
            fieldsHtml += `<td>${field.name}</td><td>${field.value}</td>`;
            if (index % 2 === 1 || index === part.fields.length - 1) {
              if (index % 2 === 0 && index === part.fields.length - 1) {
                fieldsHtml += `<td></td><td></td>`; // Empty cells for odd number of fields
              }
              fieldsHtml += `</tr>`;
            }
          });
          html += fieldsHtml;
          html += `</table>`;
        }

        // SubParts
        part.subParts?.forEach((sub) => {
          html += `<h2>${sub.subPartName}</h2>`;
          if (sub.termsAndConditions) html += `<div>${sub.termsAndConditions}</div>`;

          // Subpart fields in a 4-column table
          if (sub.fields?.length) {
            html += `<table class="field-table">`;
            html += `<tr><th>Field</th><th>Value</th><th>Field</th><th>Value</th></tr>`;
            let subFieldsHtml = '';
            sub.fields.forEach((field, index) => {
              if (index % 2 === 0) {
                subFieldsHtml += `<tr>`;
              }
              subFieldsHtml += `<td>${field.name}</td><td>${field.value}</td>`;
              if (index % 2 === 1 || index === sub.fields.length - 1) {
                if (index % 2 === 0 && index === sub.fields.length - 1) {
                  subFieldsHtml += `<td></td><td></td>`; // Empty cells for odd number of fields
                }
                subFieldsHtml += `</tr>`;
              }
            });
            html += subFieldsHtml;
            html += `</table>`;
          }
        });
      });

      html += `</body></html>`;
      return html;
    };

    const htmlContent = buildHtml(labeledResponses);

    // Save HTML temporarily
    const tempHtmlPath = path.join(process.cwd(), "temp_form.html");
    await fs.writeFile(tempHtmlPath, htmlContent, "utf-8");

    // Launch Puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(`file://${tempHtmlPath}`, { waitUntil: "networkidle0" });
    await page.pdf({ path: outputPath, format: "A4", printBackground: true });

    await browser.close();

    // Remove temp HTML
    await fs.unlink(tempHtmlPath);

    return outputPath;
  } catch (err) {
    throw new Error(`Failed to generate PDF: ${err.message}`);
  }
};