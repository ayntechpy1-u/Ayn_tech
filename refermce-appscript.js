const SHEET_ID = '1ug4NToLiMLXCGa4A9JcZre1iqMgaACDur68BsaqUmZ8';
const DRIVE_FOLDER_ID = '1bNU58nVSILMtW4RAXXlvfXHEdg4FERjH';
const CC_EMAILS = [
  'webdeveloper@achariya.org',
  'technicalhead@achariya.org',
   'recruitment@achariya.org',
  'hrd@achariya.org',
  'careers@achariya.org',
].join(',');
const HR_EMAIL = ['careers@achariya.org'].join(',');

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Empty request body");
    }

    const data = JSON.parse(e.postData.contents);

    if (!data.fullName || !data.email || !data.phone) {
      throw new Error("Missing required fields");
    }

    const resumeUrl = uploadResumeToDrive(
      data.resumeBase64,
      data.resumeFileName,
      data.resumeFileType
    );

    if (!resumeUrl || resumeUrl.startsWith("Upload failed")) {
      throw new Error("Resume upload failed");
    }

    appendToSheet(data, resumeUrl);
    sendEmailNotification(data, resumeUrl);
    sendCandidateConfirmationEmail(data);  // ✅ NEW: Auto email to candidate

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        referenceId: data.referenceId
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("doPost Error: " + error);

    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.message || "Server error"
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function uploadResumeToDrive(base64Data, fileName, mimeType) {
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
    const file = folder.createFile(blob);

    // Make file accessible
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return file.getUrl();
  } catch (error) {
    Logger.log('Drive upload error: ' + error.toString());
    return 'Upload failed (' + error.toString() + ')';
  }
}

function appendToSheet(data, resumeUrl) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheets()[0]; // First sheet

  const row = [
    data.timestamp,
    data.category,
    data.roleTitle,
    data.fullName,
    data.dob,
    data.email,
    data.phone,
    data.experience,
    data.previousCompany,
    data.previousDOJ,
    data.lastWorkingDate,
    data.noticePeriodDays,
    data.currentCTC,
    data.expectedCTC,
    data.preferredLocation,
    data.preferredCampuses?data.preferredCampuses:"-",
    resumeUrl,
    'Pending',
    data.referenceId
  ];

  sheet.appendRow(row);
}

function sendEmailNotification(data, resumeUrl) {
  const subject = `New Application Received | ${data.category} | ${data.roleTitle} | ${data.fullName}`;

  const htmlBody = `
<p>Hello Team,</p>

<p>
A new application has been submitted through the <b>Achariya Careers Portal</b>.
</p>

<hr>

<p><b>Application Summary</b></p>
<p>
<b>Category:</b> ${data.category}<br>
<b>Role Applied For:</b> ${data.roleTitle}<br>
<b>Location:</b> ${data.location}
</p>

<hr>

<p><b>Candidate Details</b></p>
<p>
<b>Name:</b> ${data.fullName}<br>
<b>Date of Birth:</b> ${data.dob}<br>
<b>Email ID:</b> ${data.email}<br>
<b>Phone Number:</b> ${data.phone}
</p>

<hr>

<p><b>Professional Information</b></p>
<p>
<b>Total Experience:</b> ${data.experience}<br>
<b>Preferred Location:</b> ${data.preferredLocation}<br>
<b>Preferred Location:</b> ${data.preferredCampuses?data.preferredCampuses:"-"}<br>
<b>Previous Company:</b> ${data.previousCompany}<br>
<b>Date of Joining (Previous Company):</b> ${data.previousDOJ}<br>
<b>Last Working Date:</b> ${data.lastWorkingDate}<br>
<b>Notice Period (Days):</b> ${data.noticePeriodDays}
</p>

<hr>

<p><b>Compensation Details</b></p>
<p>
<b>Current CTC:</b> ₹${data.currentCTC} Lakhs<br>
<b>Expected CTC:</b> ₹${data.expectedCTC} Lakhs
</p>

<hr>

<p><b>Resume</b></p>
<p>
<b>Resume File Name:</b> ${data.resumeFileName}<br>
<b>Resume Download Link:</b>
<a href="${resumeUrl}" target="_blank">Click here to download</a>
</p>

<hr>

<p><b>System Details</b></p>
<p>
<b>Application Reference ID:</b> ${data.referenceId}<br>
<b>Submitted On:</b> ${data.timestamp}
</p>

<p>
The application has also been recorded in the consolidated HR tracking sheet:<br>
<a href="https://docs.google.com/spreadsheets/d/${SHEET_ID}" target="_blank">
View HR Tracking Sheet
</a>
</p>

<p>
Please review and take the next steps as per the internal hiring process.
</p>

<p>
Regards,<br>
<b>Achariya Careers System</b>
</p>

<hr>

<p style="color: gray; font-size: 12px;">
This is an automated notification. Please do not reply to this email.
</p>
`;

  try {
    MailApp.sendEmail({
      to: HR_EMAIL,
      cc: CC_EMAILS,
      subject: subject,
      body: "A new application has been received. Please view this email in HTML format.",
      htmlBody: htmlBody
    });
  } catch (e) {
    Logger.log("Email error: " + e.toString());
  }
}

// ✅ NEW FUNCTION: Send confirmation email to candidate
function sendCandidateConfirmationEmail(data) {
  const subject = `Application Received - ${data.roleTitle} | Reference: ${data.referenceId}`;
  
  const candidateEmailBody = `Dear ${data.fullName},

Thank you for applying through our Careers page. We have successfully received your application and appreciate your interest in joining our organization.

Our recruitment team will review your profile, and shortlisted candidates will be contacted for the next steps.

We wish you all the best.

Warm regards,
HR Team
ACHARIYA Group of Institutions`;

  const htmlCandidateEmailBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; }
    .footer { background: #ecf0f1; padding: 20px; text-align: center; font-size: 12px; color: #7f8c8d; }
    .highlight { color: #e74c3c; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h2>ACHARIYA Group of Institutions</h2>
  </div>
  
  <div class="content">
    <p>Dear <strong>${data.fullName}</strong>,</p>
    
    <p>Thank you for applying through our Careers page. We have successfully received your application and appreciate your interest in joining our organization.</p>
    
    <p><strong>Application Details:</strong></p>
    <ul>
      <li><strong>Position:</strong> ${data.roleTitle}</li>
      <li><strong>Category:</strong> ${data.category}</li>
      <li><strong>Reference ID:</strong> <span class="highlight">${data.referenceId}</span></li>
      <li><strong>Submitted On:</strong> ${data.timestamp}</li>
    </ul>
    
    <p>Our recruitment team will review your profile, and shortlisted candidates will be contacted for the next steps.</p>
    
    <p>We wish you all the best.</p>
  </div>
  
  <div class="footer">
    <p>Warm regards,<br>
    <strong>HR Team</strong><br>
    ACHARIYA Group of Institutions</p>
    
    <p style="font-size: 11px; margin-top: 20px;">
      This is an automated confirmation email. Please do not reply to this email.
    </p>
  </div>
</body>
</html>`;

  try {
    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      body: candidateEmailBody,
      htmlBody: htmlCandidateEmailBody
    });
    Logger.log(`✅ Confirmation email sent to ${data.email}`);
  } catch (e) {
    Logger.log("Candidate email error: " + e.toString());
  }
}
