const express = require("express");
const cookieParser = require("cookie-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary");
const { Server } = require("socket.io");
const http = require("http"); // Needed for Socket.IO

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: function (origin, callback) {
      callback(null, origin); // Dynamically allow the incoming origin
    },
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

// Your existing routes
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.post("/enhanceprompt", async (req, res) => {
  const { data } = req.body;

  const prompt = [
    {
      text:
        "Take the following input and rewrite it into ONE single enhanced version. " +
        "Make it clearer, polished, and natural. " +
        "The response should not be repeated or give multiple options, " +
        "just ONE rewritten version that can be slightly shorter or slightly longer than the input.",
    },
    { text: data },
  ];

  const genAI = new GoogleGenerativeAI(
    "AIzaSyAQkzNA7QsznNV5C6a2SYNO3-oLxj0s9oQ"
  );
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent(prompt);

  return res.status(200).json({
    success: true,
    message: "Prompt Structured",
    data: result.response.text(),
  });
});

app.post("/uploadimage", async (req, res) => {
  try {
    const { imgfile } = req.files;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(imgfile.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Only image files (jpg, jpeg, png, gif, webp) are allowed",
      });
    }

    const options = {
      folder: "apihubusersdata",
      resource_type: "image",
    };

    const data = await cloudinary.uploader.upload(imgfile.tempFilePath, options);

    return res.status(200).json({
      success: true,
      message: "Image Uploaded",
      link: data.secure_url,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error in uploading image",
    });
  }
});

// --- Socket.IO Setup --- //
const server = http.createServer(app); // Wrap express app
const io = new Server(server, {
  path: "/api/messaging",
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("send-message", (msg) => {
     socket.broadcast.emit("receive-message", msg); 
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
