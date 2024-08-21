import pool from "../config/index.js";
import { getContactsSocket, saveMessage } from "./chatHelper.js";

export const handleChatMessage = async (io, userSocketMap, data) => {
  const { sender_id, receiver_id, message, image_url, timestamp } =
    await saveMessage(data, io);

  console.log(data);

  const receiverSocketId = userSocketMap[receiver_id];
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("chat message", {
      sender_id,
      receiver_id,
      message,
      image_url,
      timestamp,
    });
  }
  const updateLastMessageAndStatus = async (userId, contactId, message) => {
    await pool.query(
      "UPDATE contacts SET last_message = $1, last_message_timestamp = CURRENT_TIMESTAMP, status = 'online' WHERE user_id = $2 AND contact_id = $3",
      [message, userId, contactId]
    );
  };
  const senderSocketId = userSocketMap[sender_id];
  if (senderSocketId) {
    io.to(senderSocketId).emit("chat message", {
      sender_id,
      receiver_id,
      message,
      image_url,
      timestamp,
    });
  }
  // Update last message and status for sender
  await updateLastMessageAndStatus(
    sender_id,
    receiver_id,
    message
  );
  // Update last message and status for receiver
  await updateLastMessageAndStatus(
    receiver_id,
    sender_id,
    message
  );

  // Emit the updated messages and status to the sender and receiver
  const messagesSender = await getMessagesBetweenUsers(
    sender_id,
    receiver_id
  );
  io.to(userSocketMap[sender_id]).emit("messages", {
    contactId: receiver_id,
    messages: messagesSender,
  });
  const messagesReceiver = await getMessagesBetweenUsers(
    receiver_id,
    sender_id
  );
  io.to(userSocketMap[receiver_id]).emit("messages", {
    contactId: sender_id,
    messages: messagesReceiver,
  });
  console.log("sender_id", sender_id);
  const contacts = await getContactsSocket(sender_id);
  console.log("contacts", contacts);
  console.log("juser", sender_id);

  // const userSocketId = userSocketMap[sender_id];
  // console.log("socket", userSocketId);

  // // if (userSocketId) {
  //   console.log("socketd", userSocketId);
    // io.to(userSocketId).emit("registerUser",sender_id);
    io.to(userSocketMap[sender_id]).emit("getContacts", contacts);
  // }
  // Update contacts list for both sender and receiver
  // await updateContactsList(io, userSocketMap, sender_id);
  // await updateContactsList(io, userSocketMap, receiver_id);

};
const updateContactsList = async (io, userSocketMap, userId) => {
  const contacts = await getContactsSocket(userId);
  console.log("contacts", contacts);
  console.log("juser", userId);

  const userSocketId = userSocketMap[userId];
  console.log("socket", userSocketId);

  if (userSocketId) {
    console.log("socketd", userSocketId);
    // io.to(userSocketId).emit("registerUser",userId);
    io.to(userSocketMap[userId]).emit("getContacts", userId);
  }
};
export const getMessagesBetweenUsers = async (userId, contactId) => {
  const query = {
    text: `SELECT * FROM chats
           WHERE (sender_id = $1 AND receiver_id = $2)
           OR (sender_id = $2 AND receiver_id = $1)
           ORDER BY created_at`,
    values: [userId, contactId],
  };
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (err) {
    console.error("Error retrieving messages:", err);
    throw err;
  }
};
