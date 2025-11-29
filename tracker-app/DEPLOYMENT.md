# Commission Tracker - Deployment Instructions

This guide will walk you through deploying the Commission Tracker application to your Ubuntu LXC container at 192.168.50.88.

## Prerequisites

- Ubuntu LXC container running and accessible at 192.168.50.88
- SSH access to the container
- Root or sudo privileges

## Step 1: Prepare Your Local Files

From your local machine, navigate to the tracker-app directory:

```bash
cd tracker-app
```

## Step 2: Copy Files to the Container

Transfer the application files to your container:

```bash
# Create a tarball of the application
tar -czf tracker-app.tar.gz package.json server.js views/ public/ config/

# Copy to the container (replace USER with your actual username)
scp tracker-app.tar.gz USER@192.168.50.88:/tmp/
```

## Step 3: SSH into the Container

```bash
ssh USER@192.168.50.88
```

## Step 4: Install Required Packages

```bash
# Update package lists
sudo apt update

# Install Node.js and npm (if not already installed)
sudo apt install -y nodejs npm

# Install Nginx (if not already installed)
sudo apt install -y nginx

# Verify installations
node --version  # Should be v12 or higher
npm --version
nginx -v
```

## Step 5: Set Up Application Directory

```bash
# Create application directory
sudo mkdir -p /var/www/tracker

# Extract the application files
cd /var/www/tracker
sudo tar -xzf /tmp/tracker-app.tar.gz -C /var/www/tracker

# Set proper ownership
sudo chown -R www-data:www-data /var/www/tracker

# Install Node.js dependencies
cd /var/www/tracker
sudo -u www-data npm install --production
```

## Step 6: Configure Nginx

```bash
# Copy Nginx configuration
sudo cp /var/www/tracker/config/nginx-tracker.conf /etc/nginx/sites-available/tracker

# Remove default Nginx site (optional, but recommended)
sudo rm -f /etc/nginx/sites-enabled/default

# Enable the tracker site
sudo ln -s /etc/nginx/sites-available/tracker /etc/nginx/sites-enabled/tracker

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Step 7: Set Up Systemd Service

```bash
# Copy systemd service file
sudo cp /var/www/tracker/config/tracker.service /etc/systemd/system/tracker.service

# Reload systemd to recognize the new service
sudo systemctl daemon-reload

# Enable the service to start on boot
sudo systemctl enable tracker

# Start the service
sudo systemctl start tracker

# Check service status
sudo systemctl status tracker
```

## Step 8: Verify Deployment

Test the application locally on the container:

```bash
# Check if the application is running
curl http://localhost:3000/health

# Check if Nginx is proxying correctly
curl http://localhost/health
```

From your local machine, test external access:

```bash
# Test the login page
curl http://192.168.50.88/login

# Or open in your browser
# http://192.168.50.88/login
```

## Step 9: Configure Firewall (if applicable)

If you have a firewall enabled, allow HTTP traffic:

```bash
sudo ufw allow 80/tcp
sudo ufw status
```

## Troubleshooting

### Check Application Logs

```bash
# View systemd service logs
sudo journalctl -u tracker -f

# View Nginx access logs
sudo tail -f /var/log/nginx/tracker-access.log

# View Nginx error logs
sudo tail -f /var/log/nginx/tracker-error.log
```

### Restart Services

```bash
# Restart the Node.js application
sudo systemctl restart tracker

# Restart Nginx
sudo systemctl restart nginx
```

### Common Issues

1. **Port 3000 already in use:**
   ```bash
   # Find the process using port 3000
   sudo lsof -i :3000
   # Kill the process if needed
   sudo kill -9 <PID>
   ```

2. **Permission errors:**
   ```bash
   # Ensure correct ownership
   sudo chown -R www-data:www-data /var/www/tracker
   ```

3. **Nginx configuration errors:**
   ```bash
   # Test configuration
   sudo nginx -t
   # Check syntax errors in the output
   ```

## Step 10: Configure Cloudflare Tunnel (Optional)

After the application is running successfully, you can set up Cloudflare Tunnel to route rafaelmatas.com to this server.

1. Install cloudflared on the container:
   ```bash
   wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared-linux-amd64.deb
   ```

2. Authenticate with Cloudflare:
   ```bash
   cloudflared tunnel login
   ```

3. Create a tunnel:
   ```bash
   cloudflared tunnel create tracker
   ```

4. Configure the tunnel to route to localhost:80:
   ```bash
   # Create config file at ~/.cloudflared/config.yml
   # Add your tunnel configuration
   ```

5. Run the tunnel:
   ```bash
   cloudflared tunnel run tracker
   ```

## Updating the Application

To update the application in the future:

```bash
# On your local machine, create a new tarball
cd tracker-app
tar -czf tracker-app.tar.gz package.json server.js views/ public/

# Copy to container
scp tracker-app.tar.gz USER@192.168.50.88:/tmp/

# On the container
cd /var/www/tracker
sudo systemctl stop tracker
sudo tar -xzf /tmp/tracker-app.tar.gz
sudo chown -R www-data:www-data /var/www/tracker
sudo systemctl start tracker
```

## Security Notes

1. **Password Hash:** The application uses the SHA-256 hash from your GitHub Pages version. To change the password:
   - Generate a new SHA-256 hash of your desired password
   - Update `CORRECT_PASSWORD_HASH` in `/var/www/tracker/server.js`
   - Restart the service: `sudo systemctl restart tracker`

2. **HTTPS:** Currently configured for HTTP only. For production with Cloudflare Tunnel, Cloudflare will handle HTTPS.

3. **Session Secret:** The application generates a random session secret on startup. For persistence across restarts, you can set a fixed secret in the code.

## Support

If you encounter issues, check:
- Service logs: `sudo journalctl -u tracker -f`
- Nginx logs: `/var/log/nginx/tracker-*.log`
- Application is listening: `sudo netstat -tulpn | grep 3000`
- Nginx is running: `sudo systemctl status nginx`
