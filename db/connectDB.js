import mongoose from "mongoose";

export const connectDB = async () => {
	try {
		console.log("mongo_uri: ", process.env.MONGO_URI);
		const conn = await mongoose.connect("mongodb+srv://harshdev2909:harsh9560@cluster0.ew8dn.mongodb.net/");
		console.log(`MongoDB Connected: ${conn.connection.host}`);
	} catch (error) {
		console.log("Error connection to MongoDB: ", error.message);
		process.exit(1); // 1 is failure, 0 status code is success
	}
};
