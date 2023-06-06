import { RequestHandler } from "express";
import createError from "http-errors";
import { memoryDB, prisma } from "../../macro/settings.macro.js";

export const getAllUsers: RequestHandler = async (req, res, next): Promise<void> => {
  const userDataFromDB = await prisma.user.findMany({
    skip: res.locals?.skipValue || 0,
    take: res.locals?.dataPerPage || 20,
    orderBy: [res.locals?.sortingData || { createdAt: "desc" }],
    select: { password: false }
  });

  if (userDataFromDB) {
    res.status(200).json({
      status: "success",
      "total Users": memoryDB.get("totalUsersinMemoryDB"),
      data: userDataFromDB
    });
  } else next(createError(404, "No data found!"));
};

export const getAllSupportStuffs: RequestHandler = async (req, res, next): Promise<void> => {
  const userDataFromDB = await prisma.supportStuff.findMany({
    skip: res.locals?.skipValue || 0,
    take: res.locals?.dataPerPage || 20,
    orderBy: [res.locals?.sortingData || { createdAt: "desc" }],
    select: { password: false }
  });

  if (userDataFromDB) {
    res.status(200).json({
      status: "success",
      "total Users": memoryDB.get("totalSupportStuffsinMemoryDB"),
      data: userDataFromDB
    });
  } else next(createError(404, "No data found!"));
};
