require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "*", // or replace with your frontend URL in production
    credentials: true,
  })
);

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// Cloudinary setup
const { connectWithCloudinary } = require("./utils/cloudinary");
connectWithCloudinary();

// Routes
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.post("/enhanceprompt", async (req, res) => {
  try {
    const { data } = req.body;
    const prompt = [
      { text: "Rewrite this into one polished, natural version:" },
      { text: data },
    ];

    const genAI = new GoogleGenerativeAI("AIzaSyAQkzNA7QsznNV5C6a2SYNO3-oLxj0s9oQ");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);

    res.status(200).json({
      success: true,
      message: "Prompt Structured",
      data: result.response.text(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error processing prompt" });
  }
});

app.post("/uploadimage", async (req, res) => {
  try {
    const { imgfile } = req.files;
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(imgfile.mimetype)) {
      return res.status(400).json({ success: false, message: "Invalid file type" });
    }

    const options = { folder: "apihubusersdata", resource_type: "image" };
    const data = await cloudinary.uploader.upload(imgfile.tempFilePath, options);

    res.status(200).json({
      success: true,
      message: "Image Uploaded",
      link: data.secure_url,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error in uploading image" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
