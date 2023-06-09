import mongoose from "mongoose";
import { genericUserSchema } from "../admin/models.admin.js";

const supportStuffSchema = new mongoose.Schema<IUser>();

supportStuffSchema.add(genericUserSchema);

export const SupportStuff = mongoose.model("SupportStuff", supportStuffSchema);
