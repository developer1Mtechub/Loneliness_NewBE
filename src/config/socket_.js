import { getMessagesBetweenUsers, handleChatMessage } from "../utils/chat.js";
import {
  addContactForUser,
  checkValidChatTransaction,
  getContactsSocket,
  getLastMessage,
  getLastMessageTimestamp,
  handleContactsUpdate,
  notifyContacts,
  registerUser,
  removeContactForUser,
  updateContactDetails,
  updateContactStatus,
} from "../utils/chatHelper.js";
import pool from "./index.js";

// const notifyContacts = async (userId, status,onlineUsers,io) => {
//   const query = `
//     SELECT user_id
//     FROM contacts
//     WHERE contact_id = $1
//   `;
//   try {
//     const { rows } = await pool.query(query, [userId]);
//     rows.forEach((row) => {
//       const contactSocketId = onlineUsers.get(row.user_id);
//       if (contactSocketId) {
//         io.to(contactSocketId).emit('contactStatusChange', { userId, status });
//       }
//     });
//   } catch (err) {
//     console.error('Error notifying contacts', err);
//   }
// };

let userSocketMap = {};
const onlineUsers = new Map();
const socketEvents = (io) => {
  io.on("connection", (socket) => {
    socket.on("userOnline", (userId) => {
      onlineUsers.set(userId, socket.id);
      updateContactStatus(userId, "online");
      notifyContacts(userId, "online", onlineUsers, io);
    });

    console.log("A user connected:", socket.id);
    //  REGISTER USER AS ONLINE
    // socket.on("registerUser", async (userId) => {
    //   userSocketMap[userId] = socket.id;
    //   registerUser(userId, socket.id);
    //   const contacts = await handleContactsUpdate(userId);
    //   console.log(contacts);
    //   // const contacts = getContactsSocket(userId);
    //   await updateContactStatus(userId, "online");
    //   io.emit("userStatus", { userId, status: "online" });

    //   io.emit("contacts", contacts);
    //   // socket.emit("getContacts", contacts);

    //   // console.log("contacts");
    //   console.log("status");

    //   // socket.emit("me", { userId, socketId: socket.id });
    // });
    socket.on("registerUser", async (userId) => {
      userSocketMap[userId] = socket.id;
      registerUser(userId, socket.id);
      const contacts = await handleContactsUpdate(userId);
      console.log("Contacts updated:", userId);
      socket.emit("contactsUsers", contacts);
  socket.emit("getUnreadChatsCount",  { userId });
      // await updateContactStatus(userId, "online");
      // io.emit("contactsUser", userId);
      // io.emit("userStatus", { userId, status: "online" });
      // io.emit("messages",userId)

      console.log("User status updated to online:", userId);
      // io.emit("userStatus", { userId, status: "online" });
      console.log("Emitted contacts and userStatus events");
    });
    // message send
    socket.on(
      "sendMessage",
      async ({ senderId, receiverId, message, imageUrl }) => {
        const timestamp = new Date();

        // Save the message to the database
        const query = `
    INSERT INTO chats (sender_id, receiver_id, message, image_url, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $5) RETURNING *;
  `;
        const values = [senderId, receiverId, message, imageUrl, timestamp];
        const { rows } = await pool.query(query, values);

        const newMessage = rows[0];

        // Update contacts table with the latest message and timestamp
        await updateContactDetails(senderId, receiverId, message, timestamp);
        await updateContactDetails(receiverId, senderId, message, timestamp);
        await pool.query(
          `UPDATE contacts SET unread_count = unread_count + 1 WHERE user_id = $1 AND contact_id = $2`,
          [receiverId, senderId]
        );
        const contacts = await handleContactsUpdate(senderId);
        socket.emit("contactsUsers", contacts);
        // const contactsReceicer = await handleContactsUpdate(receiverId);
        // socket.emit("contactsUsers", contactsReceicer);
        const contactsReceiver = await handleContactsUpdate(receiverId);
        // Emit the message to the receiver if they are online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiveMessage", newMessage);
          io.to(receiverSocketId).emit("contactsUsers", contactsReceiver);
          io.to(receiverSocketId).emit("getUnreadChatsCount",  { userId: receiverId });

        }
      }
    );
    // delete
    // socket.on("deleteChat", async ({ userId, contactId }) => {
    //   // Mark chat as deleted by the user
    //   await pool.query(
    //     `
    //     UPDATE chats
    //     SET deleted_by_user_id = $1
    //     WHERE sender_id = $1 AND receiver_id = $2
    //   `,
    //     [userId, contactId]
    //   );

    //   // Notify the sender about the deletion
    //   socket.emit("chatDeleted", { userId, contactId });

    //   // Notify the receiver about the chat status (optional)
    //   const receiverSocketId = onlineUsers.get(contactId);
    //   if (receiverSocketId) {
    //     io.to(receiverSocketId).emit("chatStatusUpdated", {
    //       userId,
    //       contactId,
    //     });
    //   }
    // });
    socket.on("deleteChat", async ({ userId, contactId }) => {
      // Determine if the user is the sender or receiver
      const { rows } = await pool.query(
        `
        SELECT sender_id, receiver_id
        FROM chats
        WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
      `,
        [userId, contactId]
      );

      if (rows.length > 0) {
        const chat = rows[0];
        let updateField;

        if (chat.sender_id === userId) {
          updateField = "deleted_by_sender";
        } else if (chat.receiver_id === userId) {
          updateField = "deleted_by_receiver";
        }

        if (updateField) {
          await pool.query(
            `
            UPDATE chats
            SET ${updateField} = true
            WHERE sender_id = $1 AND receiver_id = $2
          `,
            [chat.sender_id, chat.receiver_id]
          );

          // Notify the sender about the deletion
          socket.emit("chatDeleted", { userId, contactId });

          // Notify the receiver about the chat status (optional)
          const receiverSocketId = onlineUsers.get(contactId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("chatStatusUpdated", {
              userId,
              contactId,
            });
          }
        }
      }
    });

    // ====

    // end
    socket.on("getContacts", async ({ contacts }) => {
      console.log("getContacts");

      // const contacts = await getContactsSocket(userId);
      socket.emit("contacts", contacts);
    });
    socket.on("userChatCountget", async (userId) => {
      console.log("count")
      await emitUnreadChatsCount(userId);
    });
    socket.on("markMessagesAsRead", async ({ userId, contactId }) => {
      const result = await pool.query(
        "UPDATE chats SET read_status = true WHERE receiver_id = $1 AND sender_id = $2 AND read_status = false",
        [userId, contactId]
      );
      await pool.query(
        `UPDATE contacts SET unread_count = 0 WHERE user_id = $1 AND contact_id = $2`,
        [userId, contactId]
      );
      const contacts = await handleContactsUpdate(userId);
      socket.emit("contactsUser", contacts);
      await emitUnreadChatsCount(userId);
    });

    socket.on("updateLastMessage", async ({ userId, contactId }) => {
      const lastMessage = await getLastMessage(userId, contactId);
      const lastMessageTimestamp = await getLastMessageTimestamp(
        userId,
        contactId
      );
      await updateContactDetails(
        userId,
        contactId,
        lastMessage,
        lastMessageTimestamp
      );
      const contacts = await handleContactsUpdate(userId);
      socket.emit("contactsUsers", contacts);
    });

    socket.on("addContact", async ({ userId, contactId }) => {
      await addContactForUser(userId, contactId);
      const contacts = await handleContactsUpdate(userId);
      socket.emit("contactsUsers", contacts);

      const contactUserContacts = await handleContactsUpdate(contactId);
      socket.to(contactId).emit("contactsUsers", contactUserContacts);
    });

    socket.on("removeContact", async ({ userId, contactId }) => {
      await removeContactForUser(userId, contactId);
      const contacts = await handleContactsUpdate(userId);
      socket.emit("contactsUsers", contacts);
    });

    socket.on("chat message", async (data) => {
      const { userId, contactId } = data;

      handleChatMessage(io, userSocketMap, data);
    });

    socket.on("getMessages", async ({ userId, contactId }) => {
      const messages = await getMessagesBetweenUsers(userId, contactId);
      console.log("messages data");
      console.log(messages);
      socket.emit("messages", messages);
    });

    socket.on("disconnected", async () => {
      console.log("User disconnected:", socket.id);
      const userId = [...onlineUsers.entries()].find(
        ([, id]) => id === socket.id
      )?.[0];
      if (userId) {
        onlineUsers.delete(userId);
        updateContactStatus(userId, "offline");
        notifyContacts(userId, "offline", onlineUsers, io);
      }
      // for (const [userId, socketId] of Object.entries(userSocketMap)) {
      //   if (socketId === socket.id) {
      //     delete userSocketMap[userId];
      //     await updateContactStatus(userId, "offline");
      //     io.emit("userStatus", { userId, status: "offline" });
      //     // Update last message and status to offline for all contacts
      //     // pool.query(
      //     //   "UPDATE contacts SET status = 'offline' WHERE contact_id = $1",
      //     //   [userId]
      //     // );
      //     break;
      //   }
      // }
    });
    const getUnreadChatsCountForUser = async (userId) => {
      const query = `
          SELECT COUNT(DISTINCT sender_id) AS total_unread_senders
    FROM chats
    WHERE sender_id = $1 AND read_status = false;

      `;
      const values = [userId];

      try {
        const res = await pool.query(query, values);
        console.log(res.rows[0]);
        return res.rows[0].total_unread_senders;
      } catch (err) {
        console.error("Error executing query", err.stack);
        throw err;
      }
    };
    async function emitUnreadChatsCount(userId) {
      try {
        const { rows } = await pool.query(
          `SELECT COUNT(*) AS unread_count FROM contacts WHERE user_id = $1 AND unread_count > 0`,
          [userId]
        );
        const unreadCounts = parseInt(rows[0].unread_count, 10);
        // const unreadCounts = await getUnreadChatsCountForUser(userId);
        // console.log("unreadCounts", unreadCounts);
        const userSocket = userSocketMap[userId];
        if (userSocket) {
          io.to(userSocket).emit("unreadChatsCount", { userId, count: unreadCounts });
        }
        // socket.emit("unreadChatsCount", { userId, count: unreadCounts });
        // const { rows } = await pool.query(
        //     "SELECT COUNT(*) AS unread_count FROM chats WHERE receiver_id = $1 AND read_status = false",
        //     [userId]
        // );

        // const totalUnread = rows.reduce(
        //     (acc, curr) => acc + parseInt(curr.unread_count, 10),
        //     0
        // );

        // const userSocket = userSocketMap[userId];
        // if (userSocket) {
        //   // io.to(userSocket).emit("messages", { userId, contactId });

        //     io.to(userSocket).emit("unreadChatsCount", { userId, count: totalUnread });
        // }
      } catch (error) {
        console.error("Error fetching unread chats count:", error);
        const userSocket = userSocketMap[userId];
        if (userSocket) {
          io.to(userSocket).emit("error", "Failed to fetch unread chats count");
        }
      }
    }
  });
};

export { socketEvents };
