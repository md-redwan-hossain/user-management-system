import mongoose from "mongoose";
import { genericUserSchema } from "../admin/models.admin.js";

const userSchema = new mongoose.Schema<IUser>();

userSchema.add(genericUserSchema);

export const User = mongoose.model("User", userSchema);
