// Logic with task scheduling
// const WebSocket = require("ws");
// const mongoose = require("mongoose");
// require("dotenv").config();

// const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mydatabase";
// mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log("Connected to MongoDB"))
//   .catch(err => console.error("MongoDB connection error:", err));

// // Define schemas
// const ChatSchema = new mongoose.Schema({
//   query: String,
//   count: Number,
//   images: [String],
//   timestamp: { type: Date, default: Date.now }
// });

// const PendingRequestSchema = new mongoose.Schema({
//   wsId: String,
//   query: String,
//   count: Number,
//   images: [String],
//   timestamp: { type: Date, default: Date.now }
// });

// // Define models
// const Chat = mongoose.model("Chat", ChatSchema);
// const PendingRequest = mongoose.model("PendingRequest", PendingRequestSchema);

// const server = new WebSocket.Server({ port: 8080 });
// console.log("WebSocket server running on ws://localhost:8080");

// // Sample images
// const IMAGE_BASE_PATH = "/assets/";
// const IMAGE_LIST = Array.from({ length: 10 }, (_, i) => `${IMAGE_BASE_PATH}${i + 1}.jpg`);

// // Store pending requests in-memory (for quick access)
// const clientRequests = new Map();

// server.on("connection", async (ws) => {
//   console.log("Client connected");

//   // Unique ID for the client (simulating a session ID)
//   const wsId = Math.random().toString(36).substr(2, 9);
//   clientRequests.set(wsId, []);

//   // **STEP 1: CHECK IF CLIENT HAS PENDING REQUESTS**
//   await sendPendingRequests(ws, wsId);

//   ws.on("message", async (message) => {
//     try {
//       const data = JSON.parse(message);
//       const count = Math.min(parseInt(data.count, 10) || 0, IMAGE_LIST.length);
//       const selectedImages = IMAGE_LIST.slice(0, count);

//       if (ws.readyState === WebSocket.OPEN) {
//         console.log("✅ Client is connected. Sending images in real-time...");
//         await new Chat({ query: data.query, count, images: selectedImages }).save();
//         sendImagesSequentially(ws, selectedImages);
//       } else {
//         console.log("⚠️ Client disconnected! Storing request in pendingRequests.");
//         await new PendingRequest({ wsId, query: data.query, count, images: selectedImages }).save();
//         clientRequests.get(wsId).push(...selectedImages);
//       }
//     } catch (error) {
//       console.error("Error processing message:", error);
//       ws.send(JSON.stringify({ error: "Invalid request" }));
//     }
//   });

//   ws.on("close", async () => {
//     console.log("Client disconnected.");
//   });
// });

// // **Function to Check & Send Pending Requests**
// async function sendPendingRequests(ws, wsId) {
//   try {
//     const pendingRequests = await PendingRequest.find({ wsId });
    
//     if (pendingRequests.length > 0) {
//       console.log(`🔄 Sending ${pendingRequests.length} pending requests to reconnected client...`);
      
//       for (const request of pendingRequests) {
//         sendImagesSequentially(ws, request.images);
//         await PendingRequest.deleteOne({ _id: request._id }); // Delete after sending
//       }
      
//       console.log("✅ Pending requests sent and removed from DB.");
//     } else {
//       console.log("⚡ No pending requests found.");
//     }
//   } catch (error) {
//     console.error("Error retrieving pending requests:", error);
//   }
// }

// // **Function to Send Images with Delay**
// function sendImagesSequentially(ws, images) {
//   let index = 0;
//   const sendNext = () => {
//     if (index < images.length && ws.readyState === WebSocket.OPEN) {
//       ws.send(JSON.stringify({ image: images[index] }));
//       index++;
//       setTimeout(sendNext, 2000);
//     } else {
//       console.log("✅ All images sent.");
//     }
//   };
//   sendNext();
// }



const WebSocket = require("ws");
const mongoose = require("mongoose");
require("dotenv").config();

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define Schema for storing pending image requests
const pendingRequestSchema = new mongoose.Schema({
  query: String,
  userID: String,
  images: [String],
  createdAt: { type: Date, default: Date.now }, 
  updatedAt: { type: Date }
});

const PendingRequest = mongoose.model("PendingRequest", pendingRequestSchema);

// WebSocket Server Setup
const server = new WebSocket.Server({ port: 8080 });

console.log("WebSocket server running on ws://localhost:8080");

// Available images (assuming they are stored in /assets/)
const IMAGE_BASE_PATH = "/assets/";
const IMAGE_LIST = Array.from({ length: 30 }, (_, i) => `${IMAGE_BASE_PATH}${i + 1}.jpg`);

server.on("connection", async (ws) => {
  console.log("Client connected");

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "request_images") {
        const { userID, count } = data;
        const selectedImages = IMAGE_LIST.slice(0, count);

        const newRequest = await PendingRequest.create({
          userID,
          query: data.query,
          images: []
        });

        const lastInsertedId = newRequest._id;
        console.log("Last Inserted ID:", lastInsertedId);

        let index = 0;
        const sendNextImage = async () => {
          if (index < selectedImages.length && ws.readyState === WebSocket.OPEN) {
            const selectedImageSingle = selectedImages[index];

            // Send the image in real-time to the frontend's live container
            ws.send(JSON.stringify({
              type: "live_image",
              image: selectedImageSingle
            }));

            // Store the image in the database
            await PendingRequest.findByIdAndUpdate(
              lastInsertedId,
              { $push: { images: selectedImageSingle } },
              { upsert: true }
            );

            console.log("Sent live image:", selectedImageSingle);
            index++;
            setTimeout(sendNextImage, 5000); // Delay of 5 seconds for the next image
          }
        };

        sendNextImage();
      }

      if (data.type === "reconnect") {
        const { userID } = data;
        const pendingRequests = await PendingRequest.find({ userID });

        if (pendingRequests.length > 0) {
          console.log(`User ${userID} reconnected, sending all pending images...`);

          // Send all previous requests to frontend
          ws.send(JSON.stringify({ allTask: pendingRequests }));

          console.log(`All pending images for user ${userID} sent.`);
        }
      }
      
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(JSON.stringify({ error: "Invalid request" }));
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});



 




// ----------------------------------------------------------------------------------------------------------------------------------
// logic with DB
// const WebSocket = require("ws");

// // mongo
// const mongoose = require("mongoose");
// require("dotenv").config(); // Load environment variables

// const server = new WebSocket.Server({ port: 8080 });

// console.log("WebSocket server running on ws://localhost:8080");

// // Connect to MongoDB
// mongoose
//   .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log("Connected to MongoDB"))
//   .catch((err) => console.error("MongoDB connection error:", err));

// // Define Mongoose Schema
// const chatSchema = new mongoose.Schema({
//   query: String,
//   count: Number,
//   images: [String], // Store images as an array of strings (URLs)
//   timestamp: { type: Date, default: Date.now },
// });
// const Chat = mongoose.model("Chat", chatSchema);


// // Available images (assuming they are stored in /assets/)
// const IMAGE_BASE_PATH = "/assets/";
// const IMAGE_LIST = Array.from({ length: 10 }, (_, i) => `${IMAGE_BASE_PATH}${i + 1}.jpg`);

// server.on("connection", (ws) => {
//   console.log("Client connected");

// //   ws.on("message", (message) => {
// //     try {
// //       const data = JSON.parse(message);
// //       const count = Math.min(parseInt(data.count, 10) || 1, IMAGE_LIST.length); // Ensure count is valid
      
// //       // Select requested number of images
// //       const selectedImages = IMAGE_LIST.slice(0, count);

// //       // Send response
// //       ws.send(JSON.stringify({ images: selectedImages }));

// //     } catch (error) {
// //       console.error("Error processing message:", error);
// //       ws.send(JSON.stringify({ error: "Invalid request" }));
// //     }
// //   });

// ws.on("message", (message) => {
//     try {
//       const data = JSON.parse(message);
//       const count = Math.min(parseInt(data.count, 10) || 1, IMAGE_LIST.length); // Ensure count is valid
      
//       // Select requested number of images
//       const selectedImages = IMAGE_LIST.slice(0, count);

      
//       // Save data to MongoDB
//       const newChat = new Chat({
//         query: data.query,
//         count: count,
//         images: selectedImages,
//       });

//        newChat.save();
//       console.log("Data saved to MongoDB:", newChat);

//       // Send images one by one with a delay
//       let index = 0;
//       const sendNextImage = () => {
//         if (index < selectedImages.length && ws.readyState === WebSocket.OPEN) {
//           ws.send(JSON.stringify({ image: selectedImages[index] })); // Send one image at a time
//           index++;
//           setTimeout(sendNextImage, 2000); // 5-second delay for the next image
//           console.log("img ent");
          
//         }
//       };

//       sendNextImage(); // Start sending images

//     } catch (error) {
//       console.error("Error processing message:", error);
//       ws.send(JSON.stringify({ error: "Invalid request" }));
//     }
//   });

//   ws.on("close", () => {
//     console.log("Client disconnected");
//   });
// });




// ----------------------------------------------------------------------------------------
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
