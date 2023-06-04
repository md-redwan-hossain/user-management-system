import { EventEmitter } from "node:events";
import { memoryDB } from "../../macro/settings.macro.js";

const supportStuffEvent = new EventEmitter();
supportStuffEvent.addListener("newSupportStuffSignup", () => {
  const currentsupportStuffCount = memoryDB.get("totalSupportStuffsinMemoryDB");
  memoryDB.set("totalSupportStuffsinMemoryDB", Number(currentsupportStuffCount) + 1);
});

supportStuffEvent.addListener("userDeleted", () => {
  const currentsupportStuffCount = memoryDB.get("totalSupportStuffsinMemoryDB");
  memoryDB.set("totalSupportStuffsinMemoryDB", Number(currentsupportStuffCount) - 1);
});
export default supportStuffEvent;
