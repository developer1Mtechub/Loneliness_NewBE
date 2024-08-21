import { getOne, insert } from "./dbUtils.js";
// import { sendNotification } from "./notification_service.js";

export const handleNotification = async (
  sender_id,
  receiver_id,
  receiver,
  title,
  body,
  type
) => {
  try {
    // const notification_type = await getOne("notification_types", {
    //   name: type,
    // });
    // send in-app notification
    const notificationData = {
      sender_id: sender_id,
      receiver_id: receiver_id,
      title,
      body,
      // type: notification_type.id,
      type,
    };
    // await insert("notifications", notificationData);
    // Sending push notification
    if (receiver.device_token) {
      const token = receiver.device_token;
      // await sendNotification(token, title, body);
    }
  } catch (error) {
    throw error;
  }
};
