import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import client from 'prom-client'//metrics collections
import { connectDB } from "./db/connectDB.js";
// import responseTime from "response-time";
import authRoutes from "./routes/auth.route.js";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "./middleware/auth.js";
dotenv.config();
import helmet from "helmet";
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later."
});
// console.log(limiter)
const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

app.use('/login', limiter); // Apply to login route to prevent brute-force attacks
app.use(helmet());

import { createLogger } from "winston";
import LokiTransport from "winston-loki";
import { User } from "./models/user.model.js";

const options = {

	transports: [
		new LokiTransport({
			host: "http://127.0.0.1:3100"
		})
	]

};
const logger = createLogger(options);
const collectDefaultMetrics = client.collectDefaultMetrics;

collectDefaultMetrics({ register: client.register });

const reqResTime = new client.Histogram({
	name: "http_express_req_res_time",
	help: "this tells how much time is taken by req and res",
	labelNames: ["method", "route", "status_code"],
	buckets: [1, 50, 200, 400, 800, 1000, 2000],
});


const totalReqCounter = new client.Counter({
	name: 'total_req',
	help: 'Tells total req',
})
app.get("/slow", async (req, res) => {
	logger.info("req came on /slow route")
	return res.json({
		status: "Success",
		message: 'heavy task completed'
	})
})
app.use((req, res, next) => {
	const start = process.hrtime();
	totalReqCounter.inc()
	res.on('finish', () => {
		const duration = process.hrtime(start);
		const time = duration[0] * 1000 + duration[1] / 1e6; // Convert to milliseconds

		// Use req.path as a fallback for route
		const route = req.route ? req.route.path : req.path;

		// Observe the time with the correct labels
		reqResTime.labels(req.method, route, res.statusCode).observe(time);
	});

	next();
});
app.get('/metrics', async (req, res) => {
	logger.info("req came on /metrics route")
	res.setHeader('Content-Type', client.register.contentType)
	const metrics = await client.register.metrics();
	res.send(metrics);
})
// app.use('/',(req,res)=>{
// 	res.send("hello server")
// })
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use(express.json()); // allows us to parse incoming requests:req.body
app.use(cookieParser()); // allows us to parse incoming cookies

app.use("/api/auth", authRoutes);
app.get('/users', async (req, res) => {
    try {
        const users = await User.find(); // Fetch all users from the database
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/users/:id', async (req, res) => {
	try {
	  const userId = req.params.id;  // Get the ID from the request parameters
	  const user = await User.findById(userId);  // Find the user by ID in the database
  
	  if (!user) {
		return res.status(404).json({ message: 'User not found' });  // Return 404 if no user is found
	  }
  
	  res.json(user);  // Return the user data if found
	} catch (error) {
	  res.status(500).json({ message: 'Server error', error });  // Handle any server errors
	}
  });
// In your app.js file, add this route:
app.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id); // Delete the user by ID
        res.status(204).send(); // Send no content on success
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
const getIpAddress = (req) => {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
};
app.post('/block-user', async (req, res) => {
	
    const { email } = req.body; // Get the email from the request
    const ipAddress = getIpAddress(req); // Get the user's IP address from request

    try {
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user as blocked and store the IP address
        user.blocked = true;
        user.ipAddress = ipAddress;
        await user.save();

        return res.status(200).json({ message: `User with email ${email} is blocked`, ipAddress });
    } catch (err) {
        return res.status(500).json({ message: 'Error blocking user', error: err.message });
    }
});
app.post('/unblock-user', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Unblock the user
        user.blocked = false;
        // user.ipAddress = null;  // Clear the stored IP
        await user.save();

        return res.status(200).json({ message: `User with email ${email} is unblocked` });
    } catch (err) {
        return res.status(500).json({ message: 'Error unblocking user', error: err.message });
    }
});
if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "/frontend/dist")));

	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
	});
}
app.get('/api/protected-route', authMiddleware, (req, res) => {
	res.send("You have access to this route");
 });
app.listen(PORT, () => {
	connectDB();
	console.log("Server is running on port: ", PORT);
});
