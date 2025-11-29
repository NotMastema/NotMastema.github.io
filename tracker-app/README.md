# Commission Tracker

A password-protected commission tracking application with server-side authentication built using Node.js and Express.

## Features

- ✅ **Server-side authentication** with SHA-256 password hashing
- ✅ **Session management** using express-session with encrypted cookies
- ✅ **Commission tracking** with monthly breakdown and analytics
- ✅ **Google Sheets integration** for data synchronization
- ✅ **Responsive design** with modern UI
- ✅ **Quota and goal tracking** with real-time attainment metrics
- ✅ **Deal management** with churn tracking

## Security Features

- SHA-256 password hashing (compatible with GitHub Pages version)
- HTTP-only secure session cookies
- Session timeout (8 hours)
- Server-side authentication (no client-side password checking)
- Protected routes with authentication middleware
- CSRF protection ready

## Technology Stack

- **Backend:** Node.js + Express
- **Session Management:** express-session
- **Template Engine:** EJS
- **Frontend:** React 18 (via CDN)
- **Styling:** Custom CSS with modern gradients
- **Web Server:** Nginx (reverse proxy)
- **Process Manager:** systemd

## Project Structure

```
tracker-app/
├── server.js              # Express server with authentication
├── package.json           # Node.js dependencies
├── views/
│   ├── login.ejs         # Login page template
│   └── tracker.ejs       # Main tracker application
├── public/
│   ├── css/
│   │   └── tracker.css   # Application styles
│   └── js/
│       └── tracker.js    # React tracker application
├── config/
│   ├── nginx-tracker.conf # Nginx configuration
│   └── tracker.service    # systemd service file
├── DEPLOYMENT.md          # Deployment instructions
└── README.md             # This file
```

## Quick Start (Development)

```bash
# Install dependencies
npm install

# Start the server
npm start

# Access the application
# Login: http://localhost:3000/login
# Tracker: http://localhost:3000/ (requires authentication)
```

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions to your Ubuntu LXC container.

Quick summary:
1. Copy files to `/var/www/tracker`
2. Install dependencies with `npm install --production`
3. Configure Nginx as reverse proxy
4. Set up systemd service
5. Start and enable the service

## Configuration

### Changing the Password

The password hash is stored in `server.js`:

```javascript
const CORRECT_PASSWORD_HASH = '68cfdf36849ee8fc9eaea9316abcbe3cf2c356c3c713236ac294007325b510ca';
```

To generate a new hash:

```bash
# Using Node.js
node -e "console.log(require('crypto').createHash('sha256').update('YOUR_PASSWORD').digest('hex'))"
```

Replace `CORRECT_PASSWORD_HASH` with the new hash and restart the service.

### Google Sheets Integration

Update the `GOOGLE_APPS_SCRIPT_URL` in `public/js/tracker.js`:

```javascript
const GOOGLE_APPS_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
```

### Session Configuration

Session settings in `server.js`:

```javascript
app.use(session({
    secret: crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,        // Set to true for HTTPS
        httpOnly: true,
        maxAge: 8 * 60 * 60 * 1000  // 8 hours
    }
}));
```

## API Endpoints

- `GET /login` - Login page
- `POST /login` - Handle login authentication
- `GET /logout` - Destroy session and redirect to login
- `GET /` - Main tracker application (protected)
- `GET /health` - Health check endpoint

## Development

```bash
# Install dev dependencies
npm install

# Run with auto-reload (requires nodemon)
npm run dev
```

## Monitoring

### Check Service Status

```bash
sudo systemctl status tracker
```

### View Logs

```bash
# Application logs
sudo journalctl -u tracker -f

# Nginx access logs
sudo tail -f /var/log/nginx/tracker-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/tracker-error.log
```

## Migration from GitHub Pages

This application is designed to replace the client-side password protection used in GitHub Pages. Key differences:

1. **Authentication:** Moved from client-side to server-side
2. **Sessions:** Uses server-side session management instead of sessionStorage
3. **Password:** Uses the same SHA-256 hash for compatibility
4. **Data:** Same localStorage persistence for tracker data
5. **UI:** Identical user interface and functionality

## License

ISC

## Author

Rafael Matas

## Support

For issues or questions, contact the repository owner or create an issue on GitHub.
