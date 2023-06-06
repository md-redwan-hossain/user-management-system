import { EventEmitter } from "node:events";
import { prisma } from "../../macro/settings.macro.js";

const adminEvent = new EventEmitter();

adminEvent.addListener(
  "newUserSignUp",
  async ({ userId, role }: { userId: string; role: string }) => {
    try {
      await prisma.userTracker.create({ data: { userId, role } });
    } catch (err) {
      console.error(err);
    }
  }
);

export default adminEvent;
