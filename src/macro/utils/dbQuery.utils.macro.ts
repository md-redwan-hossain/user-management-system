import { SupportStuff } from "../../micro/supportStuff/models.supportStuff.js";
import { User } from "../../micro/user/models.user.js";

export function dbModelDeterminer(reqPath: Array<string> | string) {
  const [, requestedPath] = (reqPath as string).split("/");
  let DbModelForQuery;
  if (requestedPath === "users") DbModelForQuery = User;
  else if (requestedPath === "support-stuffs") DbModelForQuery = SupportStuff;
  return DbModelForQuery;
}
