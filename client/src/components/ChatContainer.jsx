import React, { useContext, useEffect, useRef, useState } from "react";
import assets, { messagesDummyData } from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages } =
    useContext(ChatContext);
  const { authUser, onlineUsers } = useContext(AuthContext);

  const scrollEnd = useRef();
  const [input, setInput] = useState("");

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === "") return null;
    await sendMessage({ text: input.trim() });
    setInput("");
  };

  //handle sending an image
  const handleSendImage = async (e) => {
    const file = e.target.files[0];

    if (!file || !file.type.startsWith("image/")) {
      toast.error("select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };
  useEffect(()=>{
    if(selectedUser){
      getMessages(selectedUser._id)
    }
  },[selectedUser])

  useEffect(() => {
    if (scrollEnd.current && messages) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return selectedUser ? (
    <div className="h-full overflow-hidden relative backdrop-blur-lg">
      {/*---------------------- header---------------- */}
      <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500">
        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          className="w-8 rounded-full"
          alt="profile"
        />
        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {selectedUser.fullName}
          {onlineUsers.includes(selectedUser._id) && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
        </p>
        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt="back"
          className="md:hidden max-w-7 cursor-pointer"
        />
        <img
          src={assets.help_icon}
          alt="help"
          className="max-md:hidden max-w-5"
        />
      </div>
      {/* ------------chat area----------- */}
     <div className="flex flex-col h-[calc(100%-120px)] overflow-y-auto p-3 pb-6">
  {messages.map((msg, index) => (
    <div
      key={index}
      className={`flex items-end gap-2 mb-4 ${
        msg.senderId === authUser._id ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Profile picture - only show for received messages */}
      {msg.senderId !== authUser._id && (
        <div className="text-center text-xs">
          <img
            src={selectedUser?.profilePic || assets.avatar_icon}
            alt="sender"
            className="w-7 rounded-full"
          />
          <p className="text-gray-500">
            {formatMessageTime(msg.createdAt)}
          </p>
        </div>
      )}

      {/* Message content */}
      {msg.image ? (
        <img
          src={msg.image}
          alt="chat content"
          className={`max-w-[230px] border border-gray-700 rounded-lg overflow-hidden ${
            msg.senderId === authUser._id 
              ? "rounded-br-none" 
              : "rounded-bl-none"
          }`}
        />
      ) : (
        <p
          className={`p-3 max-w-[200px] md:text-sm font-light rounded-lg break-all text-white ${
            msg.senderId === authUser._id
              ? "bg-violet-500/30 rounded-br-none"
              : "bg-gray-700 rounded-bl-none"
          }`}
        >
          {msg.text}
        </p>
      )}

      {/* Profile picture for sent messages (right side) */}
      {msg.senderId === authUser._id && (
        <div className="text-center text-xs">
          <img
            src={authUser?.profilePic || assets.avatar_icon}
            alt="you"
            className="w-7 rounded-full"
          />
          <p className="text-gray-500">
            {formatMessageTime(msg.createdAt)}
          </p>
        </div>
      )}
    </div>
  ))}
  <div ref={scrollEnd}></div>
</div>
      {/* ---------bottom area----------- */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gray-900/50">
        <div className="flex gap-3 items-center">
          <div className="flex-1 flex items-center bg-gray-100/10 px-3 rounded-full">
            <input
              onChange={(e) => setInput(e.target.value)}
              value={input}
              onKeyDown={(e) =>
                e.key == "Enter" ? handleSendMessage(e) : null
              }
              type="text"
              placeholder="Send a message..."
              className="flex-1 text-sm p-3 bg-transparent border-none outline-none text-white placeholder-gray-400"
            />
            <input
              onChange={handleSendImage}
              type="file"
              id="image"
              accept="image/png, image/jpeg"
              hidden
            />
            <label htmlFor="image">
              <img
                src={assets.gallery_icon}
                alt="attach"
                className="w-5 mr-2 cursor-pointer"
              />
            </label>
          </div>
          <img
            onClick={handleSendMessage}
            src={assets.send_button}
            alt="send"
            className="w-7 cursor-pointer"
          />
        </div>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden h-full">
      <img src={assets.logo_icon} alt="logo" className="max-w-16" />
      <p className="text-lg font-medium text-white">Chat anytime, anywhere</p>
    </div>
  );
};

export default ChatContainer;
