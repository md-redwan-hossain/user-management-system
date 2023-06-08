import { emailConfig, nodemailerMailgun } from "../settings.macro.js";

export const sendVerificationEmail = ({ receiver, token }: { receiver: string; token: string }) => {
  return new Promise((resolve, reject) => {
    nodemailerMailgun.sendMail(
      emailConfig({
        receiver,
        subject: "Account Verification Token",
        body: `<h4>Your verification token is:  ${token}</h4>
              <h5>The code will be valid for 15 minutes.</h5>`
      }),
      (err, info) => {
        if (err) reject(err);
        else resolve(true);
      }
    );
  });
};

export const sendPasswordResetEmail = ({
  receiver,
  token
}: {
  receiver: string;
  token: string;
}) => {
  return new Promise((resolve, reject) => {
    nodemailerMailgun.sendMail(
      emailConfig({
        receiver,
        subject: "Password Reset Token",
        body: `<h4>Your password reset token is:  ${token}</h4>
              <h5>The code will be valid for 5 minutes.</h5>`
      }),
      (err, info) => {
        if (err) reject(err);
        else resolve(true);
      }
    );
  });
};
