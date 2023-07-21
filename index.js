const express = require('express');
const app = express();
const mongoose = require('mongoose');
const twilio = require('twilio');
const port = 5000
const TWILIO_ACCOUNT_SID= 'AC8168d97ccd3eaed85dc1b37b0ecf277e';
const TWILIO_AUTH_TOKEN= 'df92f5e10838155d63b240bfcbd1149d';
const TWILIO_PHONE_NUMBER= '+18064509910'

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/user-auth-api', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Create a User schema
const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    phoneNumber: String,
    otp: String,
  });
  const User = mongoose.model('User', userSchema);

// Express middleware
app.use(express.json());

// Generate OTP
function generateOTP() {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < 6; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  // Send OTP via Twilio
async function sendOTP(phoneNumber, otp) {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN); // Initialize Twilio client here
    try {
      await client.messages.create({
        body: `Your OTP is ${otp}`,
        from: TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });
      console.log('OTP sent successfully');
    } catch (error) {
      console.error('Failed to send OTP:', error);
    }
  }

  // API routes
app.post('/register', async (req, res) => {
    const { firstName, lastName, email, phoneNumber } = req.body;
  
    // Generate and save OTP
    const otp = generateOTP();
    const user = new User({ firstName, lastName, email, phoneNumber, otp });
    await user.save();
  
    // Send OTP
    sendOTP(phoneNumber, otp);
  
    res.json({ message: 'OTP sent for verification' });
  });

  app.post('/login', async (req, res) => {
    const { email, otp } = req.body;
  
    // Find user by email and OTP
    const user = await User.findOne({ email, otp });
  
    if (!user) {
      res.status(401).json({ message: 'Invalid email or OTP' });
    } else {
      res.json({ message: 'Login successful', user });
    }
  });

// Server
app.listen(port,()=>{
    console.log(`Server is listening on port ${port}`)
})

// Get Request
app.get('/',(req,res)=>{
    return res.send('Hello World')
})