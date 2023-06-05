import bcrypt from "bcrypt";
import { RequestHandler } from "express";
import createError from "http-errors";
import { Model } from "mongoose";
import { UserTracking } from "../../micro/admin/models.admin.js";
import { memoryDB } from "../settings.macro.js";
import { dbModelDeterminer } from "../utils/dbQuery.utils.macro.js";
import { excludeDataCommon } from "../utils/mongoose.util.macro.js";

export const paginationDataMemoizer = (key: string, DbModel: Model<IUser>): RequestHandler => {
  return async (req, res, next): Promise<void> => {
    if (memoryDB.get(key)) next();
    else {
      const tempData = await DbModel.countDocuments();
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

    let userDataFromDB: null | IUser;

    if (useObjectIdForQuery) {
      userDataFromDB = await dbModelDeterminer(req.path)
        .findById(queryId)
        .select(excludeDataCommon);
    } else {
      userDataFromDB = await res.locals.DbModel.findById(queryId).select(excludeDataCommon);
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

    let updatedUserDataFromDB: null | IUser;

    if (useObjectIdForQuery) {
      updatedUserDataFromDB = await dbModelDeterminer(req.path)
        .findByIdAndUpdate(queryId, res.locals.validatedReqData, {
          new: true,
          runValidators: true
        })
        .select(excludeDataCommon);
    } else {
      updatedUserDataFromDB = await res.locals.DbModel.findByIdAndUpdate(
        queryId,
        res.locals.validatedReqData,
        { new: true, runValidators: true }
      ).select(excludeDataCommon);
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

    let deletionFlag: null | IUser;

    if (useObjectIdForQuery) {
      deletionFlag = await dbModelDeterminer(req.path).findByIdAndDelete(queryId);
    } else {
      deletionFlag = await res.locals.DbModel.findByIdAndDelete(queryId);
    }

    if (!deletionFlag) next(createError(404, "User not found"));
    else {
      await UserTracking.findOneAndDelete({ userId: queryId });
      if (useObjectIdForQuery) res.status(204).end();
      else res.status(204).clearCookie("accessToken", { path: res.locals.cookiePath }).end();
    }
  };
};
