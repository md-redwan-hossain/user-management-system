import { Admin, SupportStuff, User } from "@prisma/client";
import { RequestHandler } from "express";
import { ValidationChain } from "express-validator";

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
    userId: string;
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
    DbModel;
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
      newSignedUpUser;
    }
  }

  namespace Prisma {
    interface PrismaClient {
      dbModelDeterminer(reqPath: string): SupportStuff | User | undefined;
    }
  }
}
