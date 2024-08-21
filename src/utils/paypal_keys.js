export const PaypalSandBoxUrl = "https://api.sandbox.paypal.com/v1";
export const PaypalSandBoxUrlmV2 = "https://api-m.sandbox.paypal.com/v1";
export const user_name_auth =
  "AaLRUGNwphaI0Bbf4BbITQ4gSYyQS44C0QdUwH6CBc4TG8WSpx_Ps8qXxkkUMm5Bo7boLeYMyHwlUhzu";
export const password_auth =
  "EMWjomC-k1ytxaDeTtvSSq-2jxb7Y5Za44ePA3b2xtklRN_LF5WtmA9xRgt7N8VedrTkfIEcA9qfrmN9";
export const Email_Subject_Paypal = "Withdrawl Amount Successfully!";
export const mode = "sandbox";
export const email_note = "Thanks for your patronage!";
export const getAccessToken = async () => {
   const auth = Buffer.from(`${user_name_auth}:${password_auth}`).toString(
    "base64"
  );

   const response = await fetch(`${PaypalSandBoxUrlmV2}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
};

