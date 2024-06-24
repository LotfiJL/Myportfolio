const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors"); // Add this line
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Add CORS middleware
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.DB_URI);
const db = mongoose.connection;
db.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

db.on("open", () => {
  console.log("Connected to the database successfully");
});
const submissionSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phoneNumber: String,
  topic: String,
  message: String,
  submittedAt: { type: Date, default: Date.now },
});

const Submission = mongoose.model("Submission", submissionSchema);

app.post(`/submit-form`, async (req, res) => {
  const { firstName, lastName, email, phoneNumber, topic, message } = req.body;

  try {
    const submission = new Submission({
      firstName,
      lastName,
      email,
      phoneNumber,
      topic,
      message,
    });

    await submission.save();
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "lotfijellali0@gmail.com",
        pass: process.env.PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, // Ignore SSL certificate verification
      },
    });

    transporter.verify(function (error, success) {
      if (error) {
        console.log("Error verifying transporter:", error);
      } else {
        console.log("Transporter is ready to take our messages");
      }
    });

    const mailOptions = {
      from: "lotfijellali0@gmail.com",
      to: "lotfijellali40@gmail.com",
      subject: "New Form Submission",
      html: `
        <p>First Name: ${firstName}</p>
        <p>Last Name: ${lastName}</p>
        <p>Email: ${email}</p>
        <p>Phone Number: ${phoneNumber}</p>
        <p>Topic: ${topic}</p>
        <p>Message: ${message}</p>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).send("Error: Unable to send email");
      } else {
        console.log("Email sent: " + info.response);
        res.status(200).send("Form submission successful");
      }
    });
  } catch (error) {
    console.error("Error submitting form:", error);
    res.status(500).send("Error: Unable to submit form");
  }
});

//--------------------------------------------------------------
app.get("/api/download", (req, res) => {
  const filePath = path.join(__dirname, "./cv/CV.pdf"); // Path to your PDF file
  const fileName = "CV.pdf"; // Name of the file you want to download

  // Check if the file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File does not exist
      return res.status(404).send("File not found");
    }

    // File exists, create a read stream to the file
    const fileStream = fs.createReadStream(filePath);

    // Set the appropriate headers for the file download
    res.setHeader("Content-disposition", `attachment; filename=${fileName}`);
    res.setHeader("Content-type", "application/pdf");

    // Pipe the file stream to the response object
    fileStream.pipe(res);
  });
});

////----------------------------------------
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
