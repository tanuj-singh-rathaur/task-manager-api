const sgMail = require('@sendgrid/mail')

const sendgridAPIKey = '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'

sgMail.setApiKey(sendgridAPIKey)

sgMail.send({
    to: 'tanujsingh635@gmail.com',
    from: 'sameersinghrathour635@gmail.com',
    subject: 'Thanks for joining in!',
    text: `Welcome to the app, Let me know how you get along with the app.`
}).then((result) => {
    console.log('result' + result)
}).catch((resolve) => {
    console.log('resolve' + resolve)
})