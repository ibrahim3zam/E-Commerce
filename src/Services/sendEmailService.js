import nodemailer from 'nodemailer'

export async function sendEmailService({
    to, subject, message, attachments = [] } = {}) {

    //   ====== Config Transporter
    const transporter = nodemailer.createTransport({
        host: 'localhost', // stmp.gmail.com
        port: 587, // 587 , 465
        secure: false, // false , true
        service: 'gmail', // optional
        auth: {
            // credentials
            user: 'mazensaeed434@gmail.com',
            pass: 'mmpjdoxidunrkcsn',
        },
        tls: {
            rejectUnauthorized: true
        }
    })

    const emailInfo = await transporter.sendMail({
        from: '"Fred Foo 👻" <mazensaeed434@gmail.com>',
        // cc:['',''],
        // bcc:['',''],
        to: to ? to : '',
        subject: subject ? subject : 'Hello',
        // text: text ? text : '',
        html: message ? message : '',
        attachments,
    })

    // console.log(emailInfo);
    if (emailInfo.accepted.length) {
        return true
    }
    else {
        return false
    }


}

