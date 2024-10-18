// models/UserActivityLog.js
import mongoose from "mongoose";

const userActivityLogSchema = new mongoose.Schema({
    userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, ref: 'Users' 
    },
    action: 
    { type: String, 
    required: true 
    },
    timestamp: { type: Date, default: Date.now },
    ipAddress: { type: String, required: true },
    details: { type: String }  // Additional details about the action
});

export const UserActivityLog = mongoose.model('UserActivityLog', userActivityLogSchema);
