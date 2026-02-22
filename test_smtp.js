const nodemailer = require('nodemailer');

async function testMail() {
    const smtpConfig = {
        email: 'info@periodya.com',
        password: 'ezgf kvdd mact qtcd'
    };

    console.log(`Attempting to send test email from ${smtpConfig.email}...`);

    const transporter = nodemailer.createTransport({
        service: 'gmail', // info@periodya.com uses gmail/google workspace
        auth: {
            user: smtpConfig.email,
            pass: smtpConfig.password.replace(/\s/g, '')
        }
    });

    try {
        await transporter.verify();
        console.log("SMTP Connection verified successfully!");

        const info = await transporter.sendMail({
            from: `"Periodya Test" <${smtpConfig.email}>`,
            to: 'ertkekec@gmail.com',
            subject: 'Periodya SMTP Test',
            text: 'This is a test email to verify SMTP configuration.',
            html: '<b>This is a test email to verify SMTP configuration.</b>',
        });

        console.log("Email sent successfully: %s", info.messageId);
    } catch (error) {
        console.error("SMTP Error:", error.message);
    }
}

testMail();
