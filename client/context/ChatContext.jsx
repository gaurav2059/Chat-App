import { Children, createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, SetUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState([]);
  const [unseenMessages, setUnseenMessages] = useState({});

  const { socket, axios } = useContext(AuthContext);

  //Function to get al users for sidebar
  const getUsers = async ()=>{
    try{
    const {data} =  await axios.get("/api/messages/users");
    if(data.success){
      SetUsers(data.users)
      setUnseenMessages(data.unseenMessages)
    }

    }catch(error){
      toast.error(error.messsage)

    }
  }

  //function to get messages for selected users 

  const getMessages = async (userId)=>{
    try{
     const {data} = await axios.get(`/api/messages/${userId}`);
     if(data.success){
      setMessages(data.messages)
     }

    }catch(error){
toast.error(error.messages)
    }
  }


  //function to send messages to selected users 
  const sendMessage = async(messageData)=>{
    try{
      const {data} = await axios.post(`api/messages/send/${selectedUser._id}`,messageData);
      if(data.success){
        setMessages((prevMessages)=>[...prevMessages,data.newMessage])
      }else{
        toast.error(data.messsage)
      }
    }catch(error){
toast.error(error.messages)
    }
  }
  //function to subscribe to messages for selected user
  
const subscribeToMessages = () => {
  if (!socket || !selectedUser) return;

  socket.on("newMessage", (newMessage) => {
    if (selectedUser && newMessage.senderId === selectedUser._id) {
      setMessages((prev) => [...prev, { ...newMessage, seen: true }]);
      axios.put(`/api/messages/mark/${newMessage._id}`);
    } else {
      setUnseenMessages((prev) => ({
        ...prev,
        [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1
      }));
    }
  });

  return () => {
    socket.off("newMessage");
  };
};

  //function to unsubscribe from messages
  const unsunscribeFromMessages = ()=>{
    if(socket) socket.off("newMessage")
  }
useEffect(()=>{
subscribeToMessages();
return ()=>unsunscribeFromMessages()
},[socket,selectedUser])



  const value = {
messages,users,selectedUser,getUsers, sendMessage,setSelectedUser,unseenMessages,setUnseenMessages,getMessages
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
