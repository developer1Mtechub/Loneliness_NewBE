import cloudinary from "../config/cloudinary.js";
import pool from "../config/index.js";

const userSocketMap = {};
const messageCount = {};

const registerUser = (userId, socketId) => {
  console.log("users registered")
  userSocketMap[userId] = socketId;
};
const saveMessage = async (data, io) => {
  const { sender_id, receiver_id, message, image_url } = data;
  console.log("sdjhgfhjsdg");
  console.log(image_url);

  let image = image_url;
  if (image) {
    console.log("image");
    console.log(image);

    const result = await cloudinary.uploader.upload(image.path, {
      folder: "chat_images",
    });
    console.log("result");
    console.log(result);
    image_url = result.secure_url;
  }

  const timestamp = new Date().toISOString();
  const queryResult = await pool.query(
    "INSERT INTO chats (sender_id, receiver_id, message, image_url) VALUES ($1, $2, $3, $4) RETURNING *",
    [sender_id, receiver_id, message, image_url]
  );
  // Emit getUnreadChatsCount to the receiver
  //  socket.emit(
  //   "getUnreadChatsCount",
  //   receiver_id
  //  )
  const receiverSocketId = userSocketMap[receiver_id];
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("getUnreadChatsCount", receiver_id);
    // Emit contacts to the receiver
    const contacts = getContactsSocket(receiver_id);
    io.to(receiverSocketId).emit("contacts", contacts);

    // Emit unread chats count to the receiver
    // const unreadChatsCount = await getUnreadChatsCount(receiver_id); // Assuming you have a function to get the unread chats count
    // io.to(receiverSocketId).emit("unreadChatsCount", {
    //   count: unreadChatsCount,
    // });
  }

  const key =
    sender_id < receiver_id
      ? `${sender_id}-${receiver_id}`
      : `${receiver_id}-${sender_id}`;
  messageCount[key] = (messageCount[key] || 0) + 1;

  return { sender_id, receiver_id, message, image_url, timestamp, key };
};

const getMessageCount = (key) => messageCount[key];
const resetMessageCount = (key) => {
  messageCount[key] = 0;
};

//
const userContacts = {};

const getContactsForUser = async (userId) => {
  const result = await pool.query(
    "SELECT contact_id FROM contacts WHERE user_id = $1",
    [userId]
  );
  return result.rows.map((row) => row.contact_id);
};

const addContactForUser = async (userId, contactId) => {
  console.log("contact user");
  console.log(userId);
  console.log(contactId);

  await pool.query(
    "INSERT INTO contacts (user_id, contact_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [userId, contactId]
  );
  await pool.query(
    "INSERT INTO contacts (user_id, contact_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [contactId, userId]
  );
  // await handleContactsUpdate(userId);
  // await handleContactsUpdate(contactId);
  // Emit updated contacts list for both users
  // const userContacts = await handleContactsUpdate(userId);
  // socket.to(userId).emit("contacts", userContacts);

  // const contactUserContacts = await handleContactsUpdate(contactId);
  // socket.to(contactId).emit("contacts", contactUserContacts);
  console.log("ended contact user");
};
const updateContactStatus = async (userId, status) => {
  const query = `
    UPDATE contacts
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE contact_id = $2;
  `;
  const values = [status, userId];

  try {
    const result = await pool.query(query, values);
    console.log(`Updated status for user ${userId} to ${status}`);
if(result.rows.length===0){
  return null

}else{
  return true

}
  } catch (err) {
    console.error('Error updating contact status', err.stack);
    return null
  }
};
const removeContactForUser = async (userId, contactId) => {
  await pool.query(
    "DELETE FROM contacts WHERE user_id = $1 AND contact_id = $2",
    [userId, contactId]
  );
};
const notifyContacts = async (userId, status,onlineUsers,io) => {
  const query = `
    SELECT user_id 
    FROM contacts 
    WHERE contact_id = $1
  `;
  try {
    const { rows } = await pool.query(query, [userId]);
    rows.forEach((row) => {
      const contactSocketId = onlineUsers.get(row.user_id);
      if (contactSocketId) {
        io.to(contactSocketId).emit('contactStatusChange', { userId, status });
      }
    });
  } catch (err) {
    console.log('Error notifying contacts', err);
  }
};
const getUnreadMessagesCount = async (userId, contactId) => {
  const result = await pool.query(
    "SELECT COUNT(*) FROM chats WHERE receiver_id = $1 AND sender_id = $2 AND read_status = false",
    [userId, contactId]
  );
  return result.rows[0].count;
};

const handleContactsUpdate = async (userId) => {
  console.log("handleContactsUpdate");
  console.log(userId);
  const contacts = await getContactsForUser(userId);
  const uniqueContacts = [...new Set(contacts)];
  const contactsWithDetails = await Promise.all(
    uniqueContacts.map(async (contactId) => {
      const result = await pool.query(
        // `SELECT DISTINCT ON (contacts.contact_id)
        //     contacts.contact_id,
        //     contacts.last_message,
        //     contacts.last_message_timestamp,
        //     contacts.status,
        //     users.email,
        //     user_profiles.full_name,
        //     array_agg(DISTINCT jsonb_build_object('image_url', user_images.image_url, 'public_id', user_images.public_id)) AS images
        //   FROM
        //     contacts
        //   LEFT JOIN
        //     users ON contacts.contact_id = users.id
        //   LEFT JOIN
        //     user_profiles ON contacts.contact_id = user_profiles.user_id
        //   LEFT JOIN
        //     user_images ON contacts.contact_id = user_images.user_id
        //   WHERE
        //     contacts.user_id = $1 AND contacts.contact_id = $2
        //   GROUP BY
        //     contacts.contact_id, contacts.last_message, contacts.last_message_timestamp, contacts.status,
        //     users.email, user_profiles.full_name`,
        `SELECT DISTINCT ON (contacts.contact_id)
            contacts.contact_id,
            contacts.last_message,
            contacts.last_message_timestamp,
            contacts.status,
            users.email,
            user_profiles.full_name,
            array_agg(DISTINCT jsonb_build_object('image_url', user_images.image_url, 'public_id', user_images.public_id)) AS images,
            COALESCE(user_actions.type IS NOT NULL AND user_actions.type = 'BLOCK', FALSE) OR
            COALESCE(buddy_actions.type IS NOT NULL AND buddy_actions.type = 'BLOCK', FALSE) AS block_status
          FROM
            contacts
          LEFT JOIN
            users ON contacts.contact_id = users.id
          LEFT JOIN
            user_profiles ON contacts.contact_id = user_profiles.user_id
          LEFT JOIN
            user_images ON contacts.contact_id = user_images.user_id
          LEFT JOIN
            user_actions ON contacts.user_id = user_actions.user_id AND contacts.contact_id = user_actions.buddy_id AND user_actions.type = 'BLOCK'
          LEFT JOIN
            buddy_actions ON contacts.user_id = buddy_actions.buddy_id AND contacts.contact_id = buddy_actions.user_id AND buddy_actions.type = 'BLOCK'
          WHERE
            contacts.user_id = $1 AND contacts.contact_id = $2
          GROUP BY
            contacts.contact_id, contacts.last_message, contacts.last_message_timestamp, contacts.status,
            users.email, user_profiles.full_name, block_status`,
     
        [userId,contactId]
      );

      if (result.rows.length === 0) {
        return null; // handle case where no contact details found
      }

      const contactDetails = result.rows[0];
      console.log(contactDetails);
      const unreadMessagesCount = await getUnreadMessagesCount(
        userId,
        contactId
      );

      return {
        userId: contactId,
        status: contactDetails.status,
        lastMessage: contactDetails.last_message,
        lastMessageTimestamp: contactDetails.last_message_timestamp,
        unreadCount: unreadMessagesCount,
        email: contactDetails.email,
        fullName: contactDetails.full_name,
        images: contactDetails.images,
        blockStatus: contactDetails.block_status,
      };
    })
  );

  // userContacts[userId] = contactsWithDetails.filter(
  //   (contact) => contact !== null
  // );
  // return contactsWithDetails.filter((contact) => contact !== null);
  userContacts[userId] = contactsWithDetails.filter(
    (contact) => contact !== null
  );
  return contactsWithDetails.filter((contact) => contact !== null);
};

const getContactsSocket = (userId) => {
  return userContacts[userId] || [];
};

export const getLastMessage = async (userId, contactId) => {
  const result = await pool.query(
    "SELECT message FROM chats WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1) ORDER BY created_at DESC LIMIT 1",
    [userId, contactId]
  );
  return result.rows[0]?.message || null;
};

export const getLastMessageTimestamp = async (userId, contactId) => {
  const result = await pool.query(
    "SELECT created_at FROM chats WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1) ORDER BY created_at DESC LIMIT 1",
    [userId, contactId]
  );
  return result.rows[0]?.created_at || null;
};

export const updateContactDetails = async (
  userId,
  contactId,
  lastMessage,
  lastMessageTimestamp
) => {
  console.log("update contact",userId)
  const result = await pool.query(
    "SELECT 1 FROM contacts WHERE user_id = $1 AND contact_id = $2",
    [userId, contactId]
  );

  if (result.rows.length > 0) {
    // Contact exists, update the existing record
    await pool.query(
      "UPDATE contacts SET last_message = $1, last_message_timestamp = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3 AND contact_id = $4",
      [lastMessage, lastMessageTimestamp, userId, contactId]
    );
  } else {
    // Contact does not exist, insert a new record
    await pool.query(
      "INSERT INTO contacts (user_id, contact_id, last_message, last_message_timestamp, created_at, updated_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
      [userId, contactId, lastMessage, lastMessageTimestamp]
    );
  }
  // await pool.query(
  //   "UPDATE contacts SET last_message = $1, last_message_timestamp = $2 WHERE user_id = $3 AND contact_id = $4",
  //   [lastMessage, lastMessageTimestamp, userId, contactId]
  // );
};

const checkValidChatTransaction = async (userId, buddyId) => {
  const result = await pool.query(
    "SELECT * FROM transactions WHERE user_id = $1 AND buddy_id = $2 AND type = 'CHAT' AND is_refunded = FALSE",
    [userId, buddyId]
  );
  return result.rows.length > 0;
};
export {
  registerUser,
  saveMessage,
  getMessageCount,
  resetMessageCount,
  userSocketMap,
  getContactsForUser,
  addContactForUser,
  removeContactForUser,
  handleContactsUpdate,
  getContactsSocket,
  checkValidChatTransaction,
  updateContactStatus,
  notifyContacts
};
