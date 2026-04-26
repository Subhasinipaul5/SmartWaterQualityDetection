const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendContactMail = async ({ name, email, subject, message }) => {
  await transporter.sendMail({
    from: `"Contact Form" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: subject || "New Contact Message",
    text: `
Name: ${name}
Email: ${email}

Message:
${message}
    `,
  });
};

module.exports = sendContactMail;
