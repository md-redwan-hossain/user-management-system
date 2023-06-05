import mongoose from "mongoose";

export const genericUserSchema = new mongoose.Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, "An user must have a name."],
      maxLength: 50,
      trim: true
    },
    email: {
      type: String,
      required: [true, "An user must have a email."],
      lowercase: true,
      trim: true,
      maxLength: 320,
      unique: true
    },
    password: {
      type: String,
      required: [true, "An user must have a password."]
    }
  },
  {
    timestamps: true,
    id: false,
    toJSON: {
      virtuals: true
    }
  }
);

const adminSchema = new mongoose.Schema<IUser>();

adminSchema.add(genericUserSchema).add({ role: { type: String, default: "admin" } });

const userTrackingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: {
        unique: true
      }
    },
    role: {
      type: String,
      required: true
    },

    isVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    id: false,
    toJSON: {
      virtuals: true
    }
  }
);

export const UserTracking = mongoose.model("UserTracking", userTrackingSchema);

export const Admin = mongoose.model("Admin", adminSchema);
