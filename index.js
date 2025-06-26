const fs = require("fs");
const path = require("path");
require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

const { google } = require("googleapis");

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "google-credentials.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SHEET_ID = process.env.SHEET_ID; // Add this to your .env


app.use(cors());
app.use(express.json());

app.post("/send", async (req, res) => {
  const { name, email, message, honeypot } = req.body;

if (honeypot && honeypot.trim() !== "") {
  return res.status(400).json({ success: false, message: "Spam detected" });
}

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: process.env.GMAIL_TO,
      subject: "Portfolio Contact Form Submission",
      text: message,
    });

    res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
  const sheets = google.sheets({ version: "v4", auth: await auth.getClient() });

await sheets.spreadsheets.values.append({
  spreadsheetId: SHEET_ID,
  range: "Sheet1!A:D",
  valueInputOption: "RAW",
  requestBody: {
    values: [[name, email, message, new Date().toISOString()]],
  },
});

  // Append form data to a local file
const logEntry = `[${new Date().toISOString()}] From: ${name} <${email}> \nMessage: ${message}\n\n`;

const logFilePath = path.join(__dirname, "messages.log");

fs.appendFile(logFilePath, logEntry, (err) => {
  if (err) {
    console.error("Failed to log message:", err);
  } else {
    console.log("Message logged successfully.");
  }
});

});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
