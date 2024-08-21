import { sendNotification, stripe } from "../server.js";
import { getAll, getOne, insert, update } from "./dbUtils.js";
// import { sendNotification } from "./notification_service.js";

export const releasePayment = async (request) => {
  const { user_id, buddy_id, id: request_id } = request;

  try {
    const buddy = await getOne("users", { id: buddy_id });
    const user = await getOne("users", { id: user_id });
    const transactions = await getOne("transactions", {
      request_id,
      buddy_id,
      user_id,
    });
    if (!transactions) {
      return;
    }

    const commission = await getAll("commission");
    const commission_rate = commission[0].per_hour_rate;
    const total_price = parseInt(transactions.amount);
    const commission_in_percent = commission_rate / 100;
    const application_fee = Math.round(commission_in_percent * total_price);
    const buddy_transfer_amount = total_price - application_fee;
    const transfer = await stripe.transfers.create({
      amount: buddy_transfer_amount * 100,
      currency: "usd",
      destination: buddy.connected_account_id,
    });

    const walletExists = await getOne("wallet", { buddy_id });
    let result;
    if (walletExists) {
      const newAmount =
        parseFloat(walletExists.amount) + parseFloat(transactions.amount);
      const data = { amount: newAmount };
      result = await update("wallet", data, { buddy_id });
    } else {
      const data = { buddy_id, amount: transactions.amount };
      result = await insert("wallet", data);
    }

    await update(
      "users_request",
      {
        is_released: true,
        status: "COMPLETED",
        release_payment_requests: "ACCEPTED",
        notification_sent: true,
        release_to: "BUDDY",
      },
      { id: request_id }
    );

    const user_profile = await getOne("user_profiles", { user_id });
    const title = `New Payment Released`;
    const body = `Your payment has been released by ${user_profile.full_name}.`;
    const type = "PAYMENT";
    // await sendNotification(user_id,
    //    buddy_id,
    //   //  buddy,
    //     title,
    //      body,
    //       type);

    const buddy_profile = await getOne("user_profiles", { user_id: buddy_id });
    const title_2 = `Service Completed`;
    const body_2 = `How was your experience with ${buddy_profile.full_name}? rate now!`;
    const type_2 = "SERVICES";
    // await sendNotification(buddy_id, user_id, user, title_2, body_2, type_2);
  } catch (error) {
    logger.error(`Error releasing payment: ${error}`);
  }
};
