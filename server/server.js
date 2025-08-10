import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import mongoose from "mongoose"; // Add this import
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js"
import { Server } from "socket.io";

// Create express app and http server
const app = express();
const server = http.createServer(app);

// Initialize socket.io server
export const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// Store online users
export const userSocketMap = {}; // {userId:socketId}

// Socket.io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.log("Invalid user ID connection attempt:", userId);
    socket.disconnect();
    return;
  }

  console.log(`Valid user connected: ${userId}`);
  userSocketMap[userId] = socket.id;
  io.emit("onlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${userId}`);
    delete userSocketMap[userId];
    io.emit("onlineUsers", Object.keys(userSocketMap));
  });
});


// Middleware
app.use(cors());
app.use(express.json({ limit: "4mb" }));

// API routes
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Optional root route (put AFTER)
app.get("/", (req, res) => {
  res.send("Hello from API");
});
//connect to mongodb
await connectDB();
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
