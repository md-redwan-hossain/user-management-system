import adminEvent from "../../micro/admin/events.admin.js";
import supportStuffEvent from "../../micro/supportStuff/events.supportStuff.js";
import userEvent from "../../micro/user/events.user.js";

export function fireEventOnSignUp({
  userId,
  email,
  role
}: {
  userId: string;
  email: string;
  role: string;
}) {
  adminEvent.emit("newUserSignUp", { userId, email, role });

  switch (true) {
    case role === "user":
      userEvent.emit("newUserSignup");
      break;

    case role === "supportStuff":
      supportStuffEvent.emit("newSupportStuffSignup");
      break;

    default:
      break;
  }
}
