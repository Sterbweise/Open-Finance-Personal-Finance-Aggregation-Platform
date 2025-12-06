#!/bin/bash

# Quick Hackathon Deployment Script
# Run this on your server to deploy quickly

echo "🚀 MyDuit Hackathon Quick Deploy"
echo "================================="

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "📍 Server IP: $SERVER_IP"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js $NODE_VERSION installed"
echo ""

# Ask for deployment type
echo "Choose deployment method:"
echo "1) Simple (npm start - use screen/tmux)"
echo "2) PM2 (recommended)"
echo ""
read -p "Enter choice [1-2]: " deploy_type

# Check if PM2 needed
if [ "$deploy_type" = "2" ]; then
    if ! command -v pm2 &> /dev/null; then
        echo "📦 Installing PM2..."
        sudo npm install -g pm2
    fi
fi

# Setup Backend
echo ""
echo "🔧 Setting up Backend..."
cd backend

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install

# Create .env
if [ ! -f ".env" ]; then
    echo "⚙️  Creating backend .env..."
    cat > .env << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL="file:./prod.db"
EOF
fi

# Generate Prisma
echo "🔨 Generating Prisma client..."
npx prisma generate

# Migrate
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Build
echo "🏗️  Building backend..."
npm run build

# Seed
echo "🌱 Seeding database..."
npm run db:seed

# Setup Frontend
echo ""
echo "🎨 Setting up Frontend..."
cd ../frontend

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Create .env.production
if [ ! -f ".env.production" ]; then
    echo "⚙️  Creating frontend .env.production..."
    cat > .env.production << EOF
NEXT_PUBLIC_API_URL=http://$SERVER_IP:3001
EOF
fi

# Build
echo "🏗️  Building frontend..."
npm run build

# Start services
echo ""
echo "🚀 Starting services..."

if [ "$deploy_type" = "2" ]; then
    # PM2 deployment
    cd ../backend
    pm2 delete backend 2>/dev/null || true
    pm2 start npm --name "backend" -- start
    
    cd ../frontend
    pm2 delete frontend 2>/dev/null || true
    pm2 start npm --name "frontend" -- start
    
    pm2 save
    
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "📊 Service status:"
    pm2 status
    echo ""
    echo "📋 View logs:"
    echo "   pm2 logs"
    echo ""
    echo "🔄 Restart services:"
    echo "   pm2 restart all"
    echo ""
    echo "🛑 Stop services:"
    echo "   pm2 stop all"
    
else
    # Simple deployment with instructions
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "📝 To start the services, run these commands in separate terminals:"
    echo ""
    echo "Terminal 1 (Backend):"
    echo "   cd $(pwd)/../backend"
    echo "   npm start"
    echo ""
    echo "Terminal 2 (Frontend):"
    echo "   cd $(pwd)/../frontend"
    echo "   npm start"
    echo ""
    echo "💡 TIP: Use 'screen' or 'tmux' to keep services running:"
    echo ""
    echo "   # Start backend"
    echo "   screen -S backend"
    echo "   cd backend && npm start"
    echo "   # Press Ctrl+A then D to detach"
    echo ""
    echo "   # Start frontend"
    echo "   screen -S frontend"
    echo "   cd frontend && npm start"
    echo "   # Press Ctrl+A then D to detach"
    echo ""
fi

echo ""
echo "🌐 Access your application:"
echo "   Frontend: http://$SERVER_IP:3000"
echo "   Backend:  http://$SERVER_IP:3001"
echo ""
echo "🔥 Remember to open firewall ports:"
echo "   sudo ufw allow 3000"
echo "   sudo ufw allow 3001"
echo ""
echo "Good luck with your hackathon! 🎉"

