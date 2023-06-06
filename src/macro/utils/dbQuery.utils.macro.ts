// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// export function dbModelDeterminer(reqPath: string) {
//   const [, requestedPath] = reqPath.split("/");
//   if (requestedPath === "users") return prisma.user;
//   if (requestedPath === "support-stuffs") return prisma.supportStuff;
// }

// /*

// how can I use this dbModelDeterminer function like:
// await prisma.dbModelDeterminer(req.path).findUnique{}

// */
