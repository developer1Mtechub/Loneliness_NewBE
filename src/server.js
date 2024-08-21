import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import pool from "./config/index.js";
import Stripe from "stripe";
// import { firebaseApp } from "./config/firebase.js";
import "./lib/corn_job.js";
import { __dirname } from "./dirname.js";
import http from "http";
import { Server } from "socket.io";
import { socketEvents } from "./config/socket_.js";
import paypal from "paypal-rest-sdk";

// fireebade

import admin from "firebase-admin";
import serviceAccount from "./firebase_admin.json" assert { type: "json" };
import { getOne, insert, update } from "./utils/dbUtils.js";
import {
  user_name_auth,
  password_auth,
  mode,
  PaypalSandBoxUrlmV2,
  PaypalSandBoxUrl,
  getAccessToken,
  email_note,
} from "./utils/paypal_keys.js";
import {
  sendNotFoundResponse,
  sendServerErrorResponse,
  sendSuccessResponse,
} from "./utils/responseUtils.js";
import logger from "./utils/logger.js";
import { generateMeetingCode } from "./controllers/payments/utils.js";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
paypal.configure({
  mode: mode, //sandbox or live
  client_id: user_name_auth,
  client_secret: password_auth,
});
// const path = require('path');
import path from "path";

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// const serviceAccount = require('./firebase.json');
const port = process.env.PORT || 3001;

// export const stripe = new Stripe("sk_test_51OmriNHtA3SK3biQL8S0aKmV7f0lXuskZx1007UoWekU80nAwpXCtqZM63GOr3oaHr6ewNBlY1F9hL8oQ0K8SoxL00z86ycA77");
export const stripe = new Stripe(
  "sk_test_51Ml3wJGui44lwdb4hcY6Nr91bXfxAT2KVFXMxiV6ridW3LCMcB6aoV9ZAQxL3kDjaBphiAoga8ms0zbUiQjbZgzd00DpMxrLNL"
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PUT"],
    ContentTypes: ["application/json"],
  },
});

socketEvents(io);

server.listen(port, (err) => {
  if (err) {
    console.log(err);
    return process.exit(1);
  }
  console.log(`Server is running on ${port}`);
});
export const sendNotification = async (token, title, body, data) => {
  // Convert all values in the data object to strings
  const stringData = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, String(value)])
  );
  console.log(token, title, body, data);
  const message = {
    notification: {
      title,
      body,
    },
    token,
    data: stringData,
  };

  try {
    // const notification_data = {
    //   user_id: data.user_id, // make sure sender_id is part of the data object
    //   buddy_id: data.buddy_id, // make sure receiver_id is part of the data object
    //   title,
    //   request_id: data.request_id,
    //   body,
    //   data: data.type,
    //   // make sure type is part of the data object
    // };
    const notification_data1 = {
      sender_id: data.sender_id, // make sure sender_id is part of the data object
      receiver_id: data.receiver_id, // make sure receiver_id is part of the data object
      title,
      request_id: data.request_id,
      body,
      type: data.type,
      // make sure type is part of the data object
    };
    console.log(data);
    // const result = await insert("notifications", notification_data1);

    const response = await admin.messaging().send(message);
    if (response) {
      const result = await insert("notifications", notification_data1);
      console.log("Notification data inserted successfully:", result);
    } else {
      console.error(
        "Notification sending failed, not inserting into database."
      );
    }

    console.log("Notification sent successfully:", response);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

app.post("/send-notification", async (req, res) => {
  const { title, body, imageUrl
    // ,token 
    } = req.body;
  const token = "dzL362rUQMqI2hzY8Pu2tZ:APA91bHMGBFtoiHMQdNyQ0-StE2wmlc-2k8qGexlBXu942tQ1_jAXJwPrASPXrJqxFuPTCSIew9v04huvAmZKAB6OYPhcs9vs9On0hiIfVkVWkL7PiYbFBwfpcpf8Ywj7Rg4kr-NpWD5";
  // const token = "cFMdmmlaj0gFrJSP-fwzoy:APA91bGe7ZPtXU0teXo5idct9LyDCI5ukO3OCnho1TO575cuPbtJGe9bPrDtOpioDpyVd2ZljQo0fV-zYlKZJZV6AwEPI-QISlQqdIS4vxUzd7tpAoaW0pfzOkKL8RIF0b_rh5HKdPQ2";
  const message = {
    notification: {
      title,
      body,
      imageUrl,
    },
    token, // Device token
  };

  try {
    const response = await admin.messaging().send(message);

    res
      .status(200)
      .json({ message: "Notification sent successfully", response });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.post("/send-payment", async (req, res) => {
  const { email, currency, amount } = req.body;

  try {
    // Create a Customer
    let customer = await stripe.customers.create({
      email: email,
    });

    // Create an Ephemeral Key
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2022-11-15" } // Replace with the current Stripe API version
    );

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // The amount in cents
      currency: currency,
      customer: customer.id,
    });

    // Send response
    res.json({
      customer_id: customer.id,
      ephemeral_key: ephemeralKey.secret,
      payment_intent: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ error: error.message });
  }
});
// PAYPAL APIS START
// create product
app.post("/create-product", async (req, res) => {
  try {
    // Obtain the access token
    const { name, description, type, category, image_url, home_url } = req.body;

    const accessToken = await getAccessToken();

    // Define the product data
    // const productData = {
    //   name: "Your Product Name",
    //   description: "Your Product Description",
    //   type: "SERVICE", // or "PHYSICAL"
    //   category: "SOFTWARE", // Choose an appropriate category
    //   image_url: "https://example.com/product.jpg",
    //   home_url: "https://example.com"
    // };
    const productData = {
      name,
      description,
      type, // or "PHYSICAL"
      category, // Choose an appropriate category
      image_url,
      home_url,
    };

    // Execute the product creation
    const response = await fetch(`${PaypalSandBoxUrl}/catalogs/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(productData),
    });
    // console.log(response);
    const product = await response.json();
    // insert into product table

    const newProduct = {
      name,
      description,
      type,
      category,
      image_url,
      home_url,
      paypal_product_id: product.id,
    };
    await insert("product", newProduct);

    // Return the product ID and details

    res.json({ error: false, product: product });
  } catch (error) {
    console.log(error);
    res.json({ error: true, message: error.message });
  }
});
// get products all
// get product from database
app.get("/get-products", async (req, res) => {
  try {
    const products = await pool.query("SELECT * FROM product");
    res.json({ error: false, products: products.rows });
  } catch (error) {
    console.log(error);
    res.json({ error: true, message: error.message });
  }
});
// create plan
app.post("/create-plan", async (req, res) => {
  try {
    // Obtain the access token
    const {
      product_id, // The product ID you want to associate this plan with
      name,
      description,
      interval_unit, // Could be "DAY", "WEEK", "YEAR" depending on your requirement
      interval_count, // Every 1 month
      price, // The price of the plan
      currency_code,
    } = req.body;
    const accessToken = await getAccessToken();

    // Define the plan data
    const planData = {
      product_id: product_id, // The product ID you want to associate this plan with
      name: name,
      description: description,
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: {
            interval_unit: interval_unit, // Could be "DAY", "WEEK", "YEAR" depending on your requirement
            interval_count: interval_count, // Every 1 month
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0, // 0 for infinite cycles (until canceled)
          pricing_scheme: {
            fixed_price: {
              value: price, // The price of the plan
              currency_code: currency_code,
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: "0",
          currency_code: "USD",
        },
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
      taxes: {
        percentage: "10", // Tax percentage
        inclusive: false,
      },
    };

    // Execute the plan creation
    const response = await fetch(`${PaypalSandBoxUrl}/billing/plans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(planData),
    });

    const plan = await response.json();

    // Return the plan ID and details
    // insert into plan table
    const newPlan = {
      product_id,
      name,
      description,
      interval_unit,
      interval_count,
      price,
      currency_code,
      paypal_plan_id: plan.id,
    };
    await insert("plan", newPlan);
    res.json({ error: false, plan: plan });
  } catch (error) {
    console.log(error);
    res.json({ error: true, message: error.message });
  }
});

// list of plans by product id
app.get("/list-plans/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    // const { status } = req.body; // Capture the status query parameter

    // Obtain the access token
    // const accessToken = await getAccessToken();

    // // Build the URL without status filtering
    // const url = `${PaypalSandBoxUrl}/billing/plans?page_size=10&page=1&product_id=${productId}`;

    // // Execute the plan listing
    // const response = await fetch(url, {
    //   method: "GET",
    //   headers: {
    //     "Content-Type": "application/json",
    //     Authorization: `Bearer ${accessToken}`,
    //   },
    // });

    // if (!response.ok) {
    //   throw new Error(`Error fetching plans: ${response.statusText}`);
    // }

    // const plans = await response.json();

    // // Fetch detailed pricing for each plan
    // const detailedPlans = await Promise.all(
    //   plans.plans.map(async (plan) => {
    //     const planDetailResponse = await fetch(`${PaypalSandBoxUrl}/billing/plans/${plan.id}`, {
    //       method: "GET",
    //       headers: {
    //         "Content-Type": "application/json",
    //         Authorization: `Bearer ${accessToken}`,
    //       },
    //     });

    //     if (!planDetailResponse.ok) {
    //       throw new Error(`Error fetching plan details: ${planDetailResponse.statusText}`);
    //     }

    //     return await planDetailResponse.json();
    //   })
    // );

    // // Filter plans by status if provided
    // let filteredPlans = detailedPlans;
    // if (status) {
    //   filteredPlans = detailedPlans.filter(plan => plan.status === status.toUpperCase());
    // }

    // // Return the filtered list of plans with pricing
    // res.json({ error: false, plans: filteredPlans });
    // get all from plan table
    const plans = await pool.query("SELECT * FROM plan WHERE product_id = $1", [
      productId,
    ]);
    res.json({ error: false, plans: plans.rows });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: true, message: error.message });
  }
});
// create subscrioption to some plan
app.post("/create-subscription", async (req, res) => {
  try {
    const {
      planId,
      subscriberEmail,
      subscriberName,
      user_id,
      return_url,
      cancel_url,
    } = req.body;

    const find_user = await getOne("users", { id: user_id });
    if (!find_user) {
      return sendNotFoundResponse(res, "User id not found for this user");
    }

    // Obtain the access token
    const accessToken = await getAccessToken();

    // Define the subscription data
    const subscriptionData = {
      plan_id: planId,
      subscriber: {
        name: {
          given_name: subscriberName.split(" ")[0],
          surname: subscriberName.split(" ")[1] || "",
        },
        email_address: subscriberEmail,
      },
      application_context: {
        brand_name: "Your Brand Name",
        locale: "en-US",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        return_url: return_url,
        cancel_url: cancel_url,
      },
    };

    // Create the subscription
    const response = await fetch(`${PaypalSandBoxUrl}/billing/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(subscriptionData),
    });

    if (!response.ok) {
      const errorDetails = await response.json();
      console.log("Error creating subscription:", errorDetails);
      throw new Error(`Error creating subscription: ${response.statusText}`);
    }

    const subscription = await response.json();
    console.log(subscription);
    // Insert transaction record

    // Return the subscription details
    res.json({ error: false, subscription: subscription });
  } catch (error) {
    console.log(error);
    res.json({ error: true, message: error.message });
  }
});
// success subscription
app.post("/success-subscription", async (req, res) => {
  try {
    const { user_id, subscription_id } = req.body;
    // get subscription
    if (!subscription_id) {
      return res.status(400).json({
        error: true,
        message: "Missing required parameter: subscription_id",
      });
    }

    // Obtain the access token
    const accessToken = await getAccessToken();

    // PayPal API endpoint to get subscription details
    const url = `${PaypalSandBoxUrlmV2}/billing/subscriptions/${subscription_id}`;

    // Send the GET request to fetch subscription details
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorDetails = await response.json();
      console.log("Error fetching subscription details:", errorDetails);
      return res
        .status(response.status)
        .json({ error: true, message: errorDetails.message });
    }

    const subscriptionDetails = await response.json();
    console.log(subscriptionDetails);
    if (subscriptionDetails.error) {
      return res
        .status(400)
        .json({ error: true, message: "Subscription not active" });
    } else {
      if (subscriptionDetails.status !== "ACTIVE") {
        return res
          .status(400)
          .json({ error: true, message: "Subscription not active" });
      } else {
        // get Package id
        console.log(subscriptionDetails.plan_id);
        const plan_id = subscriptionDetails.plan_id;

        // ACTiVE
        await update(
          "users",
          {
            subscription_id: subscription_id,
            plan_id: plan_id,
            is_subscribed: true,
          },
          { id: user_id }
        );
        // get plan by plan id
        const result = await getOne("plan", { paypal_plan_id: plan_id });
        console.log(result);
        const amount = parseFloat(result.price);
        // Insert transaction record
        const transaction = await insert("transactions", {
          user_id,
          amount: parseFloat(amount),
          type: "SUBSCRIPTION",
          method: "ACTIVE",
        });
        console.log("transaction added ");
        console.log(transaction);
        let admin_amount = parseFloat(amount);
        console.log(parseFloat(admin_amount));

        await insert("admin_transactions", { amount: admin_amount });
        console.log(admin_amount);
        const wallet_exists_admin = await getOne("wallet", { is_admin: true });
        if (wallet_exists_admin) {
          const sum =
            parseFloat(wallet_exists_admin.amount) + parseFloat(admin_amount);
          await update("wallet", { amount: sum }, { is_admin: true });
        } else {
          await insert("wallet", {
            amount: parseFloat(admin_amount),
            is_admin: true,
          });
        }
        console.log("admin added ");
      }
    }

    res.json({ error: false, subscription: subscriptionDetails });
    // await update(
    //   "users",
    //   {
    //     subscription_id: subscription_id,
    //     subscription_name: package_name,
    //     is_subscribed: true,
    //   },
    //   { id: user_id }
    // );
  } catch (error) {
    logger.error(`Error processing subscription: ${error.message}`);

    console.log(error);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
});
// get subscription
app.post("/subscription", async (req, res) => {
  try {
    const { user_id } = req.body;
    // get subscription id from database of table users
    const find_user = await getOne("users", { id: user_id });
    if (!find_user) {
      return sendNotFoundResponse(res, "User id not found for this user");
    }
    const subscriptionId = find_user.subscription_id;

    // Validate input
    if (!subscriptionId) {
      return res.status(400).json({
        error: true,
        message: "Missing required parameter: subscriptionId",
      });
    }

    // Obtain the access token
    const accessToken = await getAccessToken();

    // PayPal API endpoint to get subscription details
    const url = `${PaypalSandBoxUrlmV2}/billing/subscriptions/${subscriptionId}`;

    // Send the GET request to fetch subscription details
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorDetails = await response.json();
      console.log("Error fetching subscription details:", errorDetails);
      return res
        .status(response.status)
        .json({ error: true, message: errorDetails.message });
    }

    const subscriptionDetails = await response.json();
    res.json({ error: false, subscription: subscriptionDetails });
  } catch (error) {
    console.error("Failed to fetch subscription details:", error.message);
    res.status(500).json({ error: true, message: error.message });
  }
});
// cancel
app.post("/cancel-subscription", async (req, res) => {
  try {
    const { user_id, reason } = req.body;
    // get subscription id by users table by user id
    const find_user = await getOne("users", { id: user_id });
    if (!find_user) {
      return sendNotFoundResponse(res, "User id not found for this user");
    }
    const subscriptionId = find_user.subscription_id;
    // Validate input
    if (!subscriptionId) {
      return res.status(400).json({
        error: true,
        message: "Missing required parameter: subscriptionId",
      });
    }

    // Obtain the access token
    const accessToken = await getAccessToken();

    // PayPal API endpoint to cancel the subscription
    const url = `${PaypalSandBoxUrlmV2}/billing/subscriptions/${subscriptionId}/cancel`;

    // Send the POST request to cancel the subscription
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ reason: reason || "No specific reason provided" }),
    });

    if (!response.ok) {
      const errorDetails = await response.json();
      console.log("Error cancelling subscription:", errorDetails);
      return res
        .status(response.status)
        .json({ error: true, message: errorDetails.message });
    }

    // Update the user record in the database
    await update(
      "users",
      { subscription_id: null, is_subscribed: false, plan_id: null },
      { id: user_id }
    );
    const transaction = await update(
      "transactions",
      {
        type: "SUBSCRIPTION",
        method: "INACTIVE",
      },
      { user_id }
    );
    console.log("transaction added ");
    console.log(transaction);
    res.json({ error: false, message: "Subscription cancelled successfully" });
  } catch (error) {
    console.error("Failed to cancel subscription:", error.message);
    res.status(500).json({ error: true, message: error.message });
  }
});
// paypal enter service payment card
app.post("/pay", async (req, res) => {
  const { items, amount, description, redirect_urls } = req.body;
  try {
    // Obtain the access token
    const accessToken = await getAccessToken();
    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: redirect_urls,
      transactions: [
        {
          item_list: {
            items: items,
          },
          amount: amount,
          description: description,
        },
      ],
    };
    // Set up PayPal payment request
    const response = await fetch(`${PaypalSandBoxUrlmV2}/payments/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(create_payment_json),
    });

    const payment = await response.json();

    if (response.ok) {
      const approval_url = payment.links.find(
        (link) => link.rel === "approval_url"
      ).href;
      res.json({ error: false, approval_url: approval_url });
    } else {
      res.json({ error: true, message: payment });
    }
  } catch (error) {
    res.json({ error: true, message: error.message });
  }
});
app.get('/success', (req, res) => {
  res.render('success'); // Render the success.ejs file
});
app.get('/error', (req, res) => {
  res.render('error'); // Render the error.ejs file
});
// success chat paymenmt
app.post("/execute-payment-chat", async (req, res) => {
  const { paymentId, payerId,user_id,amount,buddy_id
   } = req.body;

  try {
    // Obtain the access token again
    const accessToken = await getAccessToken();

    // Execute the payment
    const response = await fetch(
      `${PaypalSandBoxUrlmV2}/payments/payment/${paymentId}/execute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ payer_id: payerId }),
      }
    );

    const payment = await response.json();
    console.log("payment");

    console.log(payment);
    if (response.ok) {
      // chat transaction 
      let transactionData;
      transactionData = {
        user_id,
        
        // request_id,
        type:"CHAT",
        method:"CARD",
        amount: amount,
        buddy_id,
        // admin_fee: application_fee,
        is_released: true,
      };
      await insert("transactions", transactionData);
      await insert("admin_transactions", { amount: amount });
      console.log("application_fee");

      console.log(amount);
      const wallet_exists = await getOne("wallet", { is_admin: true });
      if (wallet_exists) {
        const sum = parseFloat(wallet_exists.amount) + parseFloat(amount);
        await update("wallet", { amount: sum }, { is_admin: true });
      } else {
        await insert("wallet", {
          amount: parseFloat(amount),
          is_admin: true,
        });
      }

      // end 
      res.json({ error: false, payment: payment });
    } else {
      res.json({ error: true, message: payment });
    }
  } catch (error) {
    res.json({ error: true, message: error.message });
  }
});
// success payment card
app.post("/execute-payment-request", async (req, res) => {
  const {
    buddy_id,
    category_id,
    booking_date,
    booking_time,
    booking_price,
    hours,
    location,
    method,
    user_id,
    paymentId,
    payerId,
  } = req.body;
  try {
    // Obtain the access token again
    const accessToken = await getAccessToken();

    // Execute the payment
    const response = await fetch(
      `${PaypalSandBoxUrlmV2}/payments/payment/${paymentId}/execute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ payer_id: payerId }),
      }
    );

    const payment1 = await response.json();
    console.log("payment1");

    console.log(payment1);
    if (response.ok) {
      let meeting_code = generateMeetingCode();
      const insertData = {
        user_id,
        buddy_id,
        category_id,
        booking_date,
        booking_time,
        booking_price,
        hours,
        meeting_code,
        location,
      };
      let amount = booking_price;
      let transactionData;
      const result = await insert("users_request", insertData);
      if (result) {
        transactionData = {
          user_id,
          buddy_id,
          request_id: result.id,
          type: "SERVICE",
          method,
          amount: amount,
          // admin_fee: application_fee,
          is_released: false,
        };
        await insert("transactions", transactionData);
        // get user by user id
        const user = await getOne("user_profiles", { user_id: user_id });
        // get buddy by buddy id
        const buddy = await getOne("users", { id: buddy_id });
// new service request 
        const title = `New Service Request`;
        const body = `You have a new service request from ${user.full_name}.`;
        const type = "SERVICES";
        const data = {
          sender_id: user_id,
          receiver_id: buddy_id,
          request_id: result.id,
          type,
          amount: booking_price,
          is_released: false,
        };

        // stringify the data object
        // const data = JSON.stringify(data1);
        const device_token = buddy.device_token;
        console.log(device_token);
        await sendNotification(device_token, title, body, data);
        // await handleNotification(user_id, buddy.id, buddy, title, body, type);
        return sendSuccessResponse(res, result, "Request send successfully");
      }

      // res.json({ error: false, payment1: payment1 });
    } else {
      res.json({ error: true, message: payment1 });
    }
  } catch (error) {
    res.json({ error: true, message: error.message });
  }
});
// success payment card-wallet noyt completed
// app.post("/execute-payment-request", async (req, res) => {
//   const {
//     buddy_id,
//     category_id,
//     booking_date,
//     booking_time,
//     booking_price,
//     hours,
//     location,
//     method,
//     user_id,
//     paymentId,
//     payerId,
//   } = req.body;
//   try {
//     // Obtain the access token again
//     const accessToken = await getAccessToken();

//     // Execute the payment
//     const response = await fetch(
//       `${PaypalSandBoxUrlmV2}/payments/payment/${paymentId}/execute`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${accessToken}`,
//         },
//         body: JSON.stringify({ payer_id: payerId }),
//       }
//     );

//     const payment1 = await response.json();
//     console.log("payment1");

//     console.log(payment1);
//     if (response.ok) {
//       const getWallet = await getOne("wallet", { user_id });
//       console.log(getWallet.amount);
//       const newUserAmount =
//         parseFloat(booking_price) - parseFloat(getWallet.amount);
//       console.log(newUserAmount);
//       const updateUserWallet = { amount: 0 };
//       await update("wallet", updateUserWallet, { user_id });
//       let meeting_code = generateMeetingCode();
//       const insertData = {
//         user_id,
//         buddy_id,
//         category_id,
//         booking_date,
//         booking_time,
//         booking_price,
//         hours,
//         meeting_code,
//         location,
//       };
//       let amount = booking_price;
//       let transactionData;
//       const result = await insert("users_request", insertData);
//       if (result) {
//         transactionData = {
//           user_id,
//           buddy_id,
//           request_id: result.id,
//           type: "SERVICE",
//           method,
//           amount: booking_price,
//           // admin_fee: application_fee,
//           is_released: false,
//         };
//         await insert("transactions", transactionData);
//         // get user by user id
//         const user = await getOne("users", { id: user_id });
//         // get buddy by buddy id
//         const buddy = await getOne("users", { id: buddy_id });

//         const title = `New Service Request`;
//         const body = `You have a new service request from ${user.full_name}.`;
//         const type = "SERVICES";
//         const data = {
//           sender_id: user_id,
//           receiver_id: buddy_id,
//           request_id: result.id,
//           type,
//           amount: booking_price,
//           is_released: false,
//         };

//         // stringify the data object
//         // const data = JSON.stringify(data1);
//         const device_token = buddy.device_token;
//         console.log(device_token);
//         await sendNotification(device_token, title, body, data);
//         // await handleNotification(user_id, buddy.id, buddy, title, body, type);
//         return sendSuccessResponse(res, result, "Request send successfully");
//       }

//       // res.json({ error: false, payment1: payment1 });
//     } else {
//       res.json({ error: true, message: payment1 });
//     }
//   } catch (error) {
//     res.json({ error: true, message: error.message });
//   }
// });
// _______________________________________________________
// WITHDRAW USING PAYPAL PAYOUT
// _______________________________________________________
app.post("/withdraw-amount", async (req, res) => {
  const { amount, email, user_id, user_type } = req.body;
  const accessToken = await getAccessToken();
  // get user by user id
  let user;
  let wallet;
  if (user_type == "buddy") {
    user = await getOne("users", { id: user_id });
    // get user wallet
    wallet = await getOne("wallet", { buddy_id: user_id });
  } else {
    user = await getOne("users", { id: user_id });
    // get user wallet
    wallet = await getOne("wallet", { user_id });
  }
  console.log(wallet);
  console.log(user);
  let amount_wallet = parseFloat(wallet.amount);
  console.log(amount_wallet);
  // check if amount is greater than wallet amount
  if (amount > amount_wallet) {
    return res.json({
      error: true,
      message: "Amount is greater than wallet amount",
    });
  }
  // Execute the payment

  const payoutResponse = await fetch(
    `${PaypalSandBoxUrlmV2}/payments/payouts`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: `batch_${Date.now()}`,
          email_subject: "You have a payout!",
          email_message:
            "You have received a payout! Thanks for using our service.",
        },
        items: [
          {
            recipient_type: "EMAIL",
            amount: {
              value: amount,
              currency: "USD",
            },
            receiver: email,
            // receiver: "sb-9b2qe31970612@personal.example.com",
            note: email_note,
            sender_item_id: `item_${Date.now()}`,
          },
        ],
      }),
    }
  );

  const payoutData = await payoutResponse.json();
  const { batch_header, links } = payoutData;
  const status = batch_header.batch_status;

  console.log(batch_header);
  console.log(status);

  res.json({
    PaypalWithdrawObject: batch_header,
    status_Payment: status,
    links: links,
  });
});
// _______________________________________________________
// WITHDRAW CHECK SUCCESS
// _______________________________________________________
app.post("/payout-check", async (req, res) => {
  const { payoutBatchId, user_id, amount, user_type } = req.body;
  try {
    // Obtain the access token again
    const accessToken = await getAccessToken();

    // Execute the payment
    const response = await fetch(
      `${PaypalSandBoxUrl}/payments/payouts/${payoutBatchId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        // body: JSON.stringify(response),
      }
    );

    const payment = await response.json();
    console.log("payment");
    if (user_type == "buddy") {
      // get wallet user by user id
      const wallet = await getOne("wallet", { buddy_id: user_id });
      const new_amount = parseFloat(wallet.amount) - parseFloat(amount);
      await update("wallet", { amount: new_amount }, { user_id });
      const result = await insert("transactions", {
        user_id: user_id,
        amount,
        credit: false,
        method: "PAYPAL",
        type: "WITHDRAW",
      });
    } else {
      const wallet = await getOne("wallet", { user_id: user_id });
      const new_amount = parseFloat(wallet.amount) - parseFloat(amount);
      await update("wallet", { amount: new_amount }, { user_id });
      const result = await insert("transactions", {
        user_id: user_id,
        amount,
        credit: false,
        method: "PAYPAL",
        type: "WITHDRAW",
      });
    }
    // console.log(payment);
    //   const result = await insert("transactions", {
    //   user_id: user_id,
    //   amount,
    //   credit: FALSE,
    // });

    // // Update the user's wallet balance in your database
    // const new_amount = parseFloat(wallet.amount) - parseFloat(amount);
    // await update("wallet", { amount: new_amount }, { buddy_id });

    res.json({ error: false, payment: payment });
    // if (response.ok) {
    //   res.json({ error: false, payment: payment });
    // } else {
    //   res.json({ error: true, message: payment });
    // }
  } catch (error) {
    console.log(error);
    res.json({ error: true, message: error.message });
  }
});
