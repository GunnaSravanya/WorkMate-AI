import dotenv from 'dotenv';
import twilio from 'twilio';
import path from 'path';

dotenv.config({ path: './.env' });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_PHONE_NUMBER;
const baseUrl = process.env.BASE_URL;

console.log('Testing Twilio with:');
console.log('Account SID:', accountSid);
console.log('From Number:', from);
console.log('Base URL:', baseUrl);

if (!accountSid || !authToken || !from) {
    console.error('Error: Missing Twilio credentials in .env');
    process.exit(1);
}

const client = twilio(accountSid, authToken);

client.calls.create({
    to: '+919392079195', // Testing calling the same number
    from: from,
    url: `${baseUrl}/api/verification/twiml/welcome?callId=test`
})
    .then(call => {
        console.log('Success! Call SID:', call.sid);
    })
    .catch(err => {
        console.error('Twilio Error Code:', err.code);
        console.error('Twilio Error Message:', err.message);
    });
