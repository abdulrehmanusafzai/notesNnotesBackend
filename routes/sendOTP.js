const nodemailer = require('nodemailer');
require('dotenv').config();

// Authenticating the user by sending an OTP
const sendOTP = async (email, otp) => {
    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        },
    });
    let info = await transporter.sendMail({
        from: '"NoteApp" <abdulrehmanusafzai@gmail.com>',
        to: email,
        subject: `Your OTP Code for notesN'notes`,
        text: `Never share this OTP to anyone else. notesN'notes will never contact you for any thing except sending the OTP. `,
        html: `<h2>Your One Time Password for notesN'notes is <strong> ${otp}</strong></h2>`
    });
}

module.exports = sendOTP;