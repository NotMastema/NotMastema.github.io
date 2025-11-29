const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Password hash from your GitHub Pages version
// This is the SHA-256 hash of your original password
const CORRECT_PASSWORD_HASH = '68cfdf36849ee8fc9eaea9316abcbe3cf2c356c3c713236ac294007325b510ca';

// Session configuration
app.use(session({
    secret: crypto.randomBytes(32).toString('hex'), // Generate random session secret
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 8 * 60 * 60 * 1000 // 8 hours
    }
}));

// Middleware to parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use('/static', express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Helper function to hash password with SHA-256 (matching client-side implementation)
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
    if (req.session && req.session.authenticated) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Login page route
app.get('/login', (req, res) => {
    if (req.session && req.session.authenticated) {
        return res.redirect('/');
    }
    res.render('login', { error: null });
});

// Login POST handler
app.post('/login', (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.render('login', { error: 'Please enter a password' });
    }

    const hashedPassword = hashPassword(password);

    if (hashedPassword === CORRECT_PASSWORD_HASH) {
        req.session.authenticated = true;
        req.session.loginTime = new Date().toISOString();
        res.redirect('/');
    } else {
        res.render('login', { error: 'Incorrect password. Please try again.' });
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/login');
    });
});

// Protected tracker route
app.get('/', requireAuth, (req, res) => {
    res.render('tracker');
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
    console.log(`Commission Tracker server running on http://127.0.0.1:${PORT}`);
    console.log(`Login at: http://127.0.0.1:${PORT}/login`);
});
