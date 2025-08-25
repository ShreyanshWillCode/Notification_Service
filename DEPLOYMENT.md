# Deployment Guide

## Environment Variables Required

Set these environment variables in your deployment platform (Render, Heroku, etc.):

### Email Configuration (Gmail)
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Twilio Configuration
```
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

### Test User Phone Number
```
TEST_USER_PHONE=+1234567890
```

### RabbitMQ (Optional)
```
RABBIT_URL=amqp://localhost
```
*Note: If RabbitMQ is not available, the app will fallback to sending email/SMS directly*

### Server Port
```
PORT=4000
```

## Render Deployment

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set the following:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment**: Node
4. Add all the environment variables listed above
5. Deploy!

## Important Notes

- The application will work without RabbitMQ - it will send email/SMS notifications directly
- The worker process is not needed for basic functionality
- Make sure your Gmail account has "Less secure app access" enabled or use an App Password
- For Twilio, you need a verified phone number for testing
