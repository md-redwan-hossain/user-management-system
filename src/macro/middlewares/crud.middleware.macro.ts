import bcrypt from "bcrypt";
import { RequestHandler } from "express";
import createError from "http-errors";
import { memoryDB, prisma } from "../settings.macro.js";

export const paginationDataMemoizer = (key: string, DbModel): RequestHandler => {
  return async (req, res, next): Promise<void> => {
    if (memoryDB.get(key)) next();
    else {
      const tempData = await DbModel.count();
      memoryDB.set(key, tempData);
      next();
    }
  };
};

export const getProfileData: MacroMiddleware = ({ useObjectIdForQuery }) => {
  return async (req, res, next) => {
    const queryId = useObjectIdForQuery
      ? res.locals.validatedReqData.userId
      : res.locals.decodedJwt.id;

    let userDataFromDB;

    if (useObjectIdForQuery) {
      userDataFromDB = await prisma.dbModelDeterminer(req.path)?.findUnique({
        where: { id: queryId }
      });
    } else {
      userDataFromDB = await res.locals.DbModel.findUnique({
        where: { id: queryId }
      });
    }

    if (!userDataFromDB) next(createError(404, "User not found"));
    else res.status(200).json({ status: "success", data: userDataFromDB });
  };
};

export const updateProfileData: MacroMiddleware = ({ useObjectIdForQuery }) => {
  return async (req, res, next) => {
    if (res.locals.validatedReqData.updatePassword?.newPassword) {
      res.locals.validatedReqData.password = await bcrypt.hash(
        res.locals.validatedReqData.updatePassword.newPassword,
        10
      );
    }
    const queryId = useObjectIdForQuery
      ? res.locals.validatedReqData.userId
      : res.locals.decodedJwt.id;

    let updatedUserDataFromDB;

    if (useObjectIdForQuery) {
      updatedUserDataFromDB = await prisma.dbModelDeterminer(req.path)?.update({
        where: { id: queryId },
        data: res.locals.validatedReqData
      });
    } else {
      updatedUserDataFromDB = await res.locals.DbModel.update({
        where: { id: queryId },
        data: res.locals.validatedReqData
      });
    }
    if (updatedUserDataFromDB) {
      res.status(200).json({
        status: "success",
        data: updatedUserDataFromDB
      });
    } else next(createError(404, "User not found"));
  };
};

export const deleteProfile: MacroMiddleware = ({ useObjectIdForQuery }) => {
  return async (req, res, next) => {
    const queryId = useObjectIdForQuery
      ? res.locals.validatedReqData.userId
      : res.locals.decodedJwt.id;

    let deletionFlag;

    if (useObjectIdForQuery) {
      deletionFlag = await prisma.dbModelDeterminer(req.path).delete({ where: { id: queryId } });
    } else {
      deletionFlag = await res.locals.DbModel.delete({ where: { id: queryId } });
    }

    if (!deletionFlag) next(createError(404, "User not found"));
    else {
      await prisma.userTracker.delete({ where: { userId: queryId } });
      if (useObjectIdForQuery) res.status(204).end();
      else res.status(204).clearCookie("accessToken", { path: res.locals.cookiePath }).end();
    }
  };
};
