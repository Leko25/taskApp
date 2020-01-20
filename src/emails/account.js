const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API);

const sender = process.env.SENDER;

const sendSingUpEmail = async (email, name) => {
    await sgMail.send({
        to: email,
        from: sender,
        subject: 'Welcome!',
        text: `Thanks for signing up ${name}.`
    })
};

const sendCancellationEmail = async (email, name) => {
    await sgMail.send({
        to: email,
        from: sender,
        subject: 'Hope to see again!',
        text: `Dear, ${name} we are sad to see you go. Please let use know how 
        we can improve our service for to provide a better experience.`
    })
};

module.exports = {
    sendSignUpEmail: sendSingUpEmail,
    sendCancellationEmail: sendCancellationEmail
};
