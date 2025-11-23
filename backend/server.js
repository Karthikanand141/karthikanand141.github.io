require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Atlas Connected Successfully!'))
.catch(err => console.log('❌ MongoDB Connection Error:', err));

// Email Transporter - FIXED: createTransport (not createTransporter)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Routes

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: '☕ Coffee Haven API is running!',
    database: 'MongoDB Atlas (Cloud)',
    status: 'Connected'
  });
});

// Check if email exists
app.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('📧 Checking email:', email);

    if (!email) {
      return res.json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    
    res.json({
      success: true,
      exists: !!user,
      message: user ? 'User exists' : 'New user'
    });
    
  } catch (error) {
    console.error('❌ Check email error:', error);
    res.json({ success: false, exists: false, message: 'Error checking email' });
  }
});

// Sign Up
app.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    console.log('📝 Signup attempt:', { name, email });

    // Validation
    if (!name || !email || !password) {
      return res.json({ success: false, message: 'Name, email and password are required!' });
    }

    if (password.length < 6) {
      return res.json({ success: false, message: 'Password must be at least 6 characters long!' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: 'User already exists with this email!' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone: phone || ''
    });

    await user.save();

    console.log('✅ New user created:', user.email);

    res.json({ 
      success: true, 
      message: 'Account created successfully! 🎉',
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email 
      }
    });

  } catch (error) {
    console.error('❌ Signup Error:', error);
    res.json({ success: false, message: 'Server error. Please try again.' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', { email });

    // Validation
    if (!email || !password) {
      return res.json({ success: false, message: 'Email and password are required!' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: 'User not found! Please check your email.' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.json({ success: false, message: 'Invalid password! Please try again.' });
    }

    console.log('✅ Login successful:', user.email);

    res.json({
      success: true,
      message: `Welcome back, ${user.name}! ☕`,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email 
      }
    });

  } catch (error) {
    console.error('❌ Login Error:', error);
    res.json({ success: false, message: 'Server error. Please try again.' });
  }
});

// Forgot Password
app.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('📧 Forgot password request:', email);

    if (!email) {
      return res.json({ success: false, message: 'Email is required!' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: 'No account found with this email!' });
    }

    // Create reset token
    const resetToken = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    // Send email
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: 'Coffee Haven - Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6f4e37;">Coffee Haven ☕</h2>
          <h3>Password Reset Request</h3>
          <p>Hello ${user.name},</p>
          <p>You requested to reset your password. Click the link below to reset it:</p>
          <a href="${resetLink}" style="background: #6f4e37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
          <p style="margin-top: 20px; color: #666;">
            This link will expire in 1 hour. If you didn't request this, please ignore this email.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Password reset link sent to your email! 📧'
    });

  } catch (error) {
    console.error('❌ Forgot Password Error:', error);
    res.json({ success: false, message: 'Failed to send reset email. Please try again.' });
  }
});

// Get all users (for testing only)
app.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, users: users.length, data: users });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log('🚀 Coffee Haven Server Started!');
  console.log(`📍 http://localhost:${PORT}`);
  console.log('🌐 Database: MongoDB Atlas');
  console.log('');
  console.log('✅ Available Endpoints:');
  console.log('   GET  /health          - Health check');
  console.log('   POST /check-email     - Check if user exists');
  console.log('   POST /signup          - Create account');
  console.log('   POST /login           - User login');
  console.log('   POST /forgot-password - Reset password');
  console.log('   GET  /users           - View all users (testing)');
  console.log('');
  console.log('📝 Ready to accept requests!');
});

// Order Schema
const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    name: String,
    price: Number,
    quantity: Number,
    image: String
  }],
  total: Number,
  address: {
    type: String,
    default: 'Home/Office Delivery'
  },
  payment: {
    type: String,
    default: 'Cash on Delivery'
  },
  delivery: {
    type: String,
    default: 'Fast Delivery (15-30 minutes) - FREE'
  },
  status: {
    type: String,
    default: 'confirmed'
  },
  orderDate: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Generate unique order ID
function generateOrderId() {
  return 'CH' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// Create Order
app.post('/create-order', async (req, res) => {
  try {
    const { userId, items, total, address, payment } = req.body;

    const order = new Order({
      orderId: generateOrderId(),
      userId: userId,
      items: items,
      total: total,
      address: address,
      payment: payment,
      status: 'confirmed'
    });

    await order.save();

    // Send email notification
    const user = await User.findById(userId);
    if (user) {
      const mailOptions = {
        from: process.env.MAIL_USER,
        to: 'karthikanand141@gmail.com', // Your email
        subject: `New Coffee Order #${order.orderId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6f4e37;">☕ Coffee Haven - New Order</h2>
            <h3>Order #${order.orderId}</h3>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4>Customer Details:</h4>
              <p><strong>Name:</strong> ${user.name}</p>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Phone:</strong> ${user.phone || 'Not provided'}</p>
            </div>

            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4>Order Details:</h4>
              ${items.map(item => `
                <p>${item.name} × ${item.quantity} - ₹${item.price * item.quantity}</p>
              `).join('')}
              <hr>
              <p><strong>Total: ₹${total}</strong></p>
            </div>

            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4>Delivery Information:</h4>
              <p><strong>Address:</strong> ${address}</p>
              <p><strong>Payment:</strong> ${payment}</p>
              <p><strong>Delivery:</strong> Fast Delivery (15-30 minutes) - FREE</p>
            </div>

            <p style="color: #666; margin-top: 20px;">
              Order placed on: ${new Date().toLocaleString()}
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
    }

    res.json({
      success: true,
      message: 'Order placed successfully!',
      order: order
    });

  } catch (error) {
    console.error('❌ Create Order Error:', error);
    res.json({ success: false, message: 'Failed to create order' });
  }
});

// Get User Orders
app.get('/user-orders/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .sort({ orderDate: -1 });
    
    res.json({
      success: true,
      orders: orders
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});