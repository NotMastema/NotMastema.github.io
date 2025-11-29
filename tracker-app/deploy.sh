#!/bin/bash

# Commission Tracker Deployment Script
# This script helps package and deploy the application to your container

set -e

echo "📦 Commission Tracker Deployment Helper"
echo "========================================"
echo ""

# Configuration
CONTAINER_IP="${1:-192.168.50.88}"
CONTAINER_USER="${2:-$USER}"

if [ -z "$CONTAINER_IP" ] || [ -z "$CONTAINER_USER" ]; then
    echo "Usage: ./deploy.sh <container_ip> <container_user>"
    echo "Example: ./deploy.sh 192.168.50.88 myuser"
    exit 1
fi

echo "🎯 Target: $CONTAINER_USER@$CONTAINER_IP"
echo ""

# Step 1: Create tarball
echo "📦 Creating tarball..."
tar -czf tracker-app.tar.gz \
    package.json \
    server.js \
    views/ \
    public/ \
    config/ \
    README.md \
    DEPLOYMENT.md \
    --exclude='node_modules' \
    --exclude='.DS_Store' \
    --exclude='*.tar.gz'

echo "✅ Tarball created: tracker-app.tar.gz"
echo ""

# Step 2: Copy to container
echo "📤 Copying to container..."
scp tracker-app.tar.gz "$CONTAINER_USER@$CONTAINER_IP:/tmp/"
echo "✅ Files copied to /tmp/tracker-app.tar.gz"
echo ""

# Step 3: Display next steps
echo "🚀 Next Steps:"
echo "=============="
echo ""
echo "1. SSH into the container:"
echo "   ssh $CONTAINER_USER@$CONTAINER_IP"
echo ""
echo "2. Run the following commands:"
echo ""
echo "   # Create directory and extract files"
echo "   sudo mkdir -p /var/www/tracker"
echo "   sudo tar -xzf /tmp/tracker-app.tar.gz -C /var/www/tracker"
echo "   sudo chown -R www-data:www-data /var/www/tracker"
echo ""
echo "   # Install dependencies"
echo "   cd /var/www/tracker"
echo "   sudo -u www-data npm install --production"
echo ""
echo "   # Configure Nginx"
echo "   sudo cp /var/www/tracker/config/nginx-tracker.conf /etc/nginx/sites-available/tracker"
echo "   sudo ln -s /etc/nginx/sites-available/tracker /etc/nginx/sites-enabled/tracker"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "   # Set up and start service"
echo "   sudo cp /var/www/tracker/config/tracker.service /etc/systemd/system/tracker.service"
echo "   sudo systemctl daemon-reload"
echo "   sudo systemctl enable tracker"
echo "   sudo systemctl start tracker"
echo ""
echo "3. Verify deployment:"
echo "   sudo systemctl status tracker"
echo "   curl http://localhost/health"
echo ""
echo "📝 For detailed instructions, see DEPLOYMENT.md"
echo ""
echo "✨ Done! The application package is ready on the container."
