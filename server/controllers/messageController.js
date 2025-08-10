import cloudinary from "../lib/cloudinary.js";
import Message from "../models/message.js";
import User from "../models/User.js";
import { io,userSocketMap } from "../server.js";


//Get all users except logged in user
export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: userId } }).select(
      "-password"
    );
    //count number of messages not seen
    const unseenMessages = {};
    const promises = filteredUsers.map(async (user) => {
      const messages = await Message.find({
        senderId: user._id,
        receiverId: userId,
        seen: false,
      });
      if (messages.length > 0) {
        unseenMessages[user._id] = messages.length;
      }
    });
    await Promise.all(promises);
    res.json({ success: true, users: filteredUsers, unseenMessages });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: "Failed to get users" });
  }
};
//Get all messages for selected user
export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    });
    await Message.updateMany(
      { $or: [{ senderId: selectedUserId, receiverId: myId }] },
      { seen: true }
    );
    res.json({ success: true, messages });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: "Failed to get messages" });
  }
};
//api to mark messages as seen using message id
export const markMessagesAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, { seen: true });
    res.json({ success: true, message: "Messages marked as seen" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: "Failed to mark messages as seen" });
  }
};
//Send message to selected user
export const sendMessage = async (req, res) => {
  try {
    const { image, text } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;
    
    let imageUrl;
    if(image) {
      const upload = await cloudinary.uploader.upload(image);
      imageUrl = upload.secure_url;
    }

    // Create and save the message
    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl
    });

    // Emit to both sender and receiver
    const senderSocketId = userSocketMap[senderId];
    const receiverSocketId = userSocketMap[receiverId];
    
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", newMessage);
    }
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.json({success: true, newMessage});
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: "Failed to send message" });
  }
};