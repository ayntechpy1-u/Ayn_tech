/*********************************
 * CONFIGURATION
 *********************************/
const SHEET_ID = "1BRkyWTR-Vh-OcEnMqpBabBEEH16bSaHpK79BahqS5zg"; // Google Sheet ID
const ADMIN_EMAIL = "ayntechpy1@gmail.com"; // Admin email to receive enquiry

/*********************************
 * HANDLE CORS PREFLIGHT (OPTIONS)
 *********************************/
function doGet(e) {
  // Handle CORS preflight requests
  return ContentService.createTextOutput(
    JSON.stringify({ status: "ready" }),
  ).setMimeType(ContentService.MimeType.JSON);
}

/*********************************
 * HANDLE FORM SUBMISSION
 *****************/
function doPost(e) {
  try {
    // Handle both form-encoded and JSON data
    let data;

    if (e.parameter && Object.keys(e.parameter).length > 0) {
      // Form-encoded data (avoids CORS preflight)
      data = e.parameter;
    } else if (e.postData && e.postData.contents) {
      // JSON data (for backward compatibility)
      data = JSON.parse(e.postData.contents);
    } else {
      throw new Error("Empty request body");
    }

    // Validation
    if (
      !data.firstName ||
      !data.lastName ||
      !data.email ||
      !data.subject ||
      !data.message
    ) {
      throw new Error("Missing required fields");
    }

    const timestamp = new Date();

    // Save to Google Sheet
    appendToSheet(data, timestamp);

    // Send admin email
    sendAdminEmail(data, timestamp);

    // Success response with CORS headers
    return ContentService.createTextOutput(
      JSON.stringify({ success: true }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/*********************************
 * SAVE DATA TO GOOGLE SHEET
 *****************/
function appendToSheet(data, timestamp) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];

  sheet.appendRow([
    timestamp,
    data.firstName,
    data.lastName,
    data.phone,
    data.email,
    data.subject,
    data.message,
  ]);
}

/*********************************
 * SEND EMAIL TO ADMIN
 *********************************/
function sendAdminEmail(data, timestamp) {
  const subject = `📩 New Enquiry Received – ${data.subject}`;

  const body = `
New enquiry received from website

Name: ${data.firstName} ${data.lastName}
Phone: ${data.phone} 
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}

Received On:
${timestamp}
`;

  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: subject,
    body: body,
  });
}
