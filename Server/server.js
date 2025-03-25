const WebSocket = require("ws");

// mongo
const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables

const server = new WebSocket.Server({ port: 8080 });

console.log("WebSocket server running on ws://localhost:8080");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define Mongoose Schema
const chatSchema = new mongoose.Schema({
  query: String,
  count: Number,
  images: [String], // Store images as an array of strings (URLs)
  timestamp: { type: Date, default: Date.now },
});
const Chat = mongoose.model("Chat", chatSchema);


// Available images (assuming they are stored in /assets/)
const IMAGE_BASE_PATH = "/assets/";
const IMAGE_LIST = Array.from({ length: 10 }, (_, i) => `${IMAGE_BASE_PATH}${i + 1}.jpg`);

server.on("connection", (ws) => {
  console.log("Client connected");

//   ws.on("message", (message) => {
//     try {
//       const data = JSON.parse(message);
//       const count = Math.min(parseInt(data.count, 10) || 1, IMAGE_LIST.length); // Ensure count is valid
      
//       // Select requested number of images
//       const selectedImages = IMAGE_LIST.slice(0, count);

//       // Send response
//       ws.send(JSON.stringify({ images: selectedImages }));

//     } catch (error) {
//       console.error("Error processing message:", error);
//       ws.send(JSON.stringify({ error: "Invalid request" }));
//     }
//   });

ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      const count = Math.min(parseInt(data.count, 10) || 1, IMAGE_LIST.length); // Ensure count is valid
      
      // Select requested number of images
      const selectedImages = IMAGE_LIST.slice(0, count);

      
      // Save data to MongoDB
      const newChat = new Chat({
        query: data.query,
        count: count,
        images: selectedImages,
      });

       newChat.save();
      console.log("Data saved to MongoDB:", newChat);

      // Send images one by one with a delay
      let index = 0;
      const sendNextImage = () => {
        if (index < selectedImages.length && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ image: selectedImages[index] })); // Send one image at a time
          index++;
          setTimeout(sendNextImage, 2000); // 5-second delay for the next image
          console.log("img ent");
          
        }
      };

      sendNextImage(); // Start sending images

    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(JSON.stringify({ error: "Invalid request" }));
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});





// const WebSocket = require("ws");

// const server = new WebSocket.Server({ port: 8080 });

// server.on("connection", (ws) => {
//   console.log("Client connected");

//   ws.on("message", (message) => {
//     console.log("Received:", message.toString());
//     ws.send("Message received: " + message);
//   });

//   ws.on("close", () => {
//     console.log("Client disconnected");
//   });
// });

// console.log("WebSocket server running on ws://localhost:8080");
