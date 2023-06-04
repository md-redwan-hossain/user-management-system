import bcrypt from "bcrypt";
import { ValidationChain, body } from "express-validator";
import validator from "validator";
import { UserTracking } from "../../micro/admin/models.admin.js";
import { makeFieldOptional } from "../utils/expressValidator.util.macro.js";
import { verifyJwt } from "../utils/jwt.util.macro.js";
import {
  passwordValidation,
  stringTrim,
  validateEmailAndNormalize
} from "../utils/validators.util.macro.js";

/* eslint no-param-reassign: 0 */
export const validateEmail: CustomValidationChain = ({ isOptional }) => {
  return [
    makeFieldOptional({ optionalFlag: isOptional, field: "email" })[0]
      .trim()
      .notEmpty()
      .withMessage("Email can't be empty")
      .bail()
      .isEmail()
      .withMessage("Invalid Email")
      .bail()
      .isLength({ max: 50 })
      .withMessage("Max length is 50 characters")
      .bail()
      .normalizeEmail({
        all_lowercase: true,
        gmail_remove_dots: false
      })
  ];
};

export const validateEmailUniqueConstraint: CustomValidationChain = ({ isOptional }) => {
  return [
    makeFieldOptional({ optionalFlag: isOptional, field: "email" })[0].custom(
      async (emailFromRequestBody: string, { req }): Promise<boolean> => {
        const isExistingUser = await req?.res.locals.DbModel.findOne({
          email: emailFromRequestBody
        });
        if (isExistingUser) throw new Error("Email already in use");
        else return true;
      }
    )
  ];
};

export const validatePassword: CustomValidationChain = ({ isOptional }) => {
  return [
    makeFieldOptional({ optionalFlag: isOptional, field: "password" })[0]
      .trim()
      .notEmpty()
      .withMessage("Password can't be empty")
      .bail()
      .isLength({ min: 8, max: 128 })
      .withMessage("Password must be 8-128 characters long")
      .isStrongPassword({
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
      })
      .withMessage(
        "Password must contain 1 uppercase letter, 1 lowercase letter, 1 digit, 1 special character, and no space"
      )
  ];
};

export const validateChangePassword: CustomValidationChain = ({ isOptional }) => {
  return [
    makeFieldOptional({ optionalFlag: isOptional, field: "updatePassword" })[0]
      .custom((data: IPasswordUpdateData) => {
        if (data.oldPassword && data.newPassword) return true;
        throw new Error(" Maintain updatePassword{oldPassword, newPassword}");
      })
      .bail()
      .custom((data: IPasswordUpdateData) => {
        data.oldPassword = stringTrim(data.oldPassword);
        data.newPassword = stringTrim(data.oldPassword);
        if (data.oldPassword && data.newPassword) return true;
        throw new Error("oldPassword or newPassword can't be empty");
      })
      .bail()
      .custom((data: IPasswordUpdateData) => {
        if (data.oldPassword !== data.newPassword) return true;
        throw new Error("oldPassword and newPassword can't be same.");
      })
      .bail()
      .custom(async (_, { req }): Promise<boolean> => {
        const decodedJwt = (await verifyJwt(req.cookies?.accessToken)) as IDecodedJwtPayload;
        if (decodedJwt) {
          req.res.locals.userId = decodedJwt.id;
          return true;
        }
        throw new Error("JWT verification failed");
      })
      .bail()
      .custom(async (data: IPasswordUpdateData, { req }): Promise<boolean> => {
        const { password: oldPasswordInDb } = await req.res.locals.DbModel.findById(
          req.res.locals.userId
        );
        const isValidOldPassword: boolean = await bcrypt.compare(data.oldPassword, oldPasswordInDb);
        if (isValidOldPassword) return true;
        throw new Error("Old password does not matched with Database");
      })
      .bail()
      .custom((data: IPasswordUpdateData) => {
        passwordValidation(data.newPassword);
        if (passwordValidation(data.newPassword)) return true;
        throw new Error(
          "newPassword range 8-128 and must contain 1 uppercase, lowercase, digit, and character"
        );
      })
  ];
};

export const validateLoginCredentials = (): ValidationChain[] => {
  return [
    body("")
      .custom((data: ILoginData) => {
        if (data.email && data.password) return true;
        throw new Error("email and password are required.");
      })
      .bail()
      .custom((data: ILoginData) => {
        data.email = stringTrim(data.email);
        data.password = stringTrim(data.password);
        if (data.email && data.password) return data;
        throw new Error("email and password can't be empty");
      })
      .custom((data: ILoginData) => {
        if (passwordValidation(data.password)) return true;
        throw new Error(
          "password range 8-128 and must contain 1 uppercase, lowercase, digit, and character"
        );
      })
      .bail()
      .custom((data: ILoginData) => {
        if (validateEmailAndNormalize(data.email)) {
          data.email = validateEmailAndNormalize(data.email);
          return data;
        }
        throw new Error("Invalid email");
      })
      .bail()
      .custom(async (data: ILoginData, { req }): Promise<boolean> => {
        const retrievedUser = await req.res.locals.DbModel.findOne({ email: data.email });
        if (retrievedUser) {
          req.res.locals.retrivedDbData = {
            userId: retrievedUser._id,
            password: retrievedUser.password
          } as IDbData;
          return true;
        }
        req.res.locals.expressValidatorErrorCode = 401;
        throw new Error("No user found with the given email.");
      })
      .bail()
      .custom(async (_, { req }): Promise<boolean> => {
        req.res.locals.userStatus = await UserTracking.findOne({
          userId: req.res.locals.retrivedDbData?.userId
        });
        if (req.res.locals.userStatus?.isBanned) throw new Error("User is banned");
        if (!req.res.locals.userStatus?.isVerified) throw new Error("User is not verified");
        else return true;
      })
      .bail()
      .custom(async (data: ILoginData, { req }): Promise<boolean> => {
        const isValidPassword = await bcrypt.compare(
          data.password,
          req.res.locals.retrivedDbData.password
        );
        if (isValidPassword) {
          return true;
        }
        req.res.locals.expressValidatorErrorCode = 401;
        throw new Error("Wrong credentials");
      })
      .bail()
      .custom(async (_, { req }): Promise<boolean> => {
        if (req.res.locals.userStatus?.isDeactivated) {
          await UserTracking.findOneAndUpdate(
            { userId: req.res.locals.retrivedDbData.userId },
            { isDeactivated: false }
          );
        }
        return true;
      })
  ];
};

export const validateSignUpCredentials = (): ValidationChain[] => {
  return [
    validateEmailUniqueConstraint({ isOptional: false })[0],
    validatePassword({ isOptional: false })[0]
  ];
};

// export const validateResetPassword = (): ValidationChain[] => {
//   return [body("email")];
// };
