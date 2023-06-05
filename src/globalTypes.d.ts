import { RequestHandler } from "express";
import { ValidationChain } from "express-validator";
import mongoose, { Document, Model } from "mongoose";

declare global {
  type MicroValidator = ({ useForUpdate }: { useForUpdate: boolean }) => Array<ValidationChain[]>;

  type MacroJwtValidator = ({
    fieldName,
    skipisVerifiedChecking
  }: {
    fieldName: string;
    skipisVerifiedChecking: boolean;
  }) => ValidationChain[];

  type ValidationTokenValue = {
    userId: mongoose.Types.ObjectId | string;
    token: string;
  };

  type MicroMiddleware = ({ useForUpdate }: { useForUpdate: boolean }) => RequestHandler;

  type CustomValidationChain = ({ isOptional }: { isOptional: boolean }) => ValidationChain[];

  type IdentityValidationChain = ({
    isOptional,
    uniqueConstraint,
    useForPasswordReset,
    useForUpdateByOtherUser
  }: {
    isOptional: boolean;
    uniqueConstraint: boolean;
    useForPasswordReset: boolean;
    useForUpdateByOtherUser: boolean;
  }) => ValidationChain[];

  type MacroMiddleware = ({
    useObjectIdForQuery
  }: {
    useObjectIdForQuery: boolean;
  }) => RequestHandler;

  type StringField = ({
    fieldName,
    maxLength,
    isOptional
  }: {
    fieldName: string;
    maxLength: number;
    isOptional: boolean;
  }) => ValidationChain[];

  type StringEnumField = ({
    fieldName,
    enumArray,
    makeUpperCase,
    isOptional
  }: {
    fieldName: string;
    enumArray: string[];
    makeUpperCase: boolean;
    isOptional: boolean;
  }) => ValidationChain[];

  interface IRoleModelCookiePathInjector {
    role: string;
    DbModel: Model<IUser>;
    cookiePath: string;
  }

  interface IDecodedJwtPayload {
    role: string;
    id: string;
    iat: number;
    exp: number;
    pin?: string;
    forgot?: boolean;
    reset?: boolean;
  }

  interface IPasswordUpdateData {
    oldPassword: string;
    newPassword: string;
  }

  interface ILoginData {
    email: string;
    password: string;
  }

  interface IDbData {
    userId?: string;
    password?: string;
    isDeactivated?: boolean;
  }

  interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    fullName: string;
    email: string;
    password: string;
    dateOfBirth: Date;
    gender: string;
    bio?: string;
    createdAt: Date;
    updatedAt: Date;
    role: string;
  }

  namespace Express {
    interface Locals {
      sortingData: any;
      skipValue: number;
      dataPerPage: number;
      expressValidatorErrorCode: number;
      isExpressValidatorError: boolean;
      validatedReqData: any;
      retrivedDbData: any;
      DbModel;
      doctorChamberUniqueString: string;
      allowedRoleInRoute: string;
      cookiePath: string;
      decodedJwt: IDecodedJwtPayload;
      jwtForSignUp: string;
      newSignedUpUser: IUser;
    }
  }
}
