import {
	PASSWORD_RESET_REQUEST_TEMPLATE,
	PASSWORD_RESET_SUCCESS_TEMPLATE,
	VERIFICATION_EMAIL_TEMPLATE,
	WELCOME_EMAIL,
} from "./emailTemplates.js";
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
	service: "gmail",
	port: 465,
	priority: "high",
	secure: true,
	auth: {
		user: "harshsharmaa990@gmail.com",
		pass: "gncqwoyeibggmjxz",
	},
});


export const sendVerificationEmail = async (email, verificationToken) => {
	try {
		await transporter.sendMail({
			from: "harshsharmaa990@gmail.com",
			to: email,
			subject: "Verify your email",
			html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
		})
		console.log("Email sent successfully");
	} catch (error) {
		console.error(`Error sending verification`, error);

		throw new Error(`Error sending verification email: ${error}`);
	}
};

export const sendWelcomeEmail = async (email, name) => {
	try {
		await transporter.sendMail({
			from: "harshsharmaa990@gmail.com",
			to: email,
			subject: "Welcome Email",
			html: WELCOME_EMAIL.replace("{Name}", name),
		})

		console.log("Welcome email sent successfully");
	} catch (error) {
		console.error(`Error sending welcome email`, error);

		throw new Error(`Error sending welcome email: ${error}`);
	}
};

export const sendPasswordResetEmail = async (email, resetURL) => {
	try {
		await transporter.sendMail({
			from: "harshsharmaa990@gmail.com",
			to: email,
			subject: "Reset your password",
			html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
		})
	} catch (error) {
		console.error(`Error sending password reset email`, error);

		throw new Error(`Error sending password reset email: ${error}`);
	}
};

export const sendResetSuccessEmail = async (email) => {
	try {
		await transporter.sendMail({
			from: "harshsharmaa990@gmail.com",
			to: email,
			subject: "Password Reset Successful",
			html: PASSWORD_RESET_SUCCESS_TEMPLATE,
		})
		console.log("Password reset email sent successfully");
	} catch (error) {
		console.error(`Error sending password reset success email`, error);

		throw new Error(`Error sending password reset success email: ${error}`);
	}
};