import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Initialize express app
const app = express();

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN, // Ensure CORS_ORIGIN is defined in .env
    credentials: true
}));

// Middleware for parsing JSON and URL-encoded data
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Static file serving
app.use(express.static("public"));

// Cookie parser for handling cookies
app.use(cookieParser());

// Import routes
import userRouter from './routes/user.routes.js';
import videoRouter from './routes/video.routes.js';

// Use the imported router for /api/v1/users
app.use('/api/v1/users', userRouter);

// Use the imported router for /api/v1/videos
app.use('/api/v1/videos', videoRouter);

// Export the app if it's needed in another module
export { app };
