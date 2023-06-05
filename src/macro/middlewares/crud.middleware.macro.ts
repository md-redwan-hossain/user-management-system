import bcrypt from "bcrypt";
import { RequestHandler } from "express";
import createError from "http-errors";
import { Model } from "mongoose";
import { memoryDB } from "../settings.macro.js";
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
    const userDataFromDB = await res.locals.DbModel.findById(queryId).select(excludeDataCommon);

    if (userDataFromDB) {
      res.status(200).json({ status: "success", data: userDataFromDB });
    } else {
      next(createError(404, "User not found"));
    }
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

    const updatedUserDataFromDB: IUser = await res.locals.dbdbModel
      .findByIdAndUpdate(queryId, res.locals.validatedReqData, { new: true, runValidators: true })
      .select(excludeDataCommon);

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

    const deletionFlag = await res.locals.DbModel.findByIdAndDelete(queryId);

    if (deletionFlag) {
      res.status(204).clearCookie("accessToken", { path: res.locals.cookiePath }).end();
    } else {
      next(createError(404, "User not found"));
    }
  };
};
