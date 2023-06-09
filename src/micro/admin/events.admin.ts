import { EventEmitter } from "node:events";

import mongoose from "mongoose";
import { UserTracker } from "./models.admin.js";

const adminEvent = new EventEmitter();

adminEvent.addListener(
  "newUserSignUp",
  async ({
    userId,
    email,
    role
  }: {
    userId: mongoose.Types.ObjectId;
    email: string;
    role: string;
  }) => {
    try {
      const newUser = new UserTracker({ userId, email, role });
      await newUser.save();
    } catch (err) {
      console.error(err);
    }
  }
);

export default adminEvent;
