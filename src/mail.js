const nodemailer = require('nodemailer');

// a transport is a 1-way method of sending email
exports.transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// template out email
// one could alternatively use MJML to template emails in react
// this is where you'd impliment a fancy templating tool
exports.createEmailBody = text => `
  <div className="email" style="
    border=: 1px solid black;
    padding: 20px;
    font-family: sans-serif;
    line-height: 2;
    font-size: 20px;
  ">
    <h2>Hello there</h2>
    <p>${text}</p>
    <p>😘 Asher</p>
  </div>
`;