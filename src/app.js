import express from "express";
import compression from "compression";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import fs from "fs";
import path from "path";
import { __dirname } from "./dirname.js";
import routes from "./routes/api.js";

// Initialize express app
const app = express();

// Apply middlewares
// app.use(compression());
app.use(cors());
// app.use(helmet());
app.use(express.static("public"));

// Apply body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply cookie parser
app.use(cookieParser());

// 
app.use(express.static(path.join(__dirname, "public")));
app.get("/index", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// use api routes
app.use("/api", routes);

// Setup morgan for logging to file and console
if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined", { stream: accessLogStream }));
} else {
  app.use(morgan("dev"));
}

// Set rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Export the app
export default app;
 