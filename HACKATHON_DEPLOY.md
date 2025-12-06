# Quick Hackathon Deployment Guide 🚀

Simple guide to deploy your app on a server for a hackathon demo.

## Option 1: Simple Deploy (Fastest - 5 minutes)

### Prerequisites

- A server with Node.js 18+ installed
- SSH access to your server

### Steps

1. **Connect to your server**

```bash
ssh user@your-server-ip
```

2. **Install Node.js (if not installed)**

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v20.x
```

3. **Upload your code**

```bash
# On your local machine
scp -r . user@your-server-ip:/home/user/myduit/
# Or use git
# ssh into server, then:
cd ~
git clone <your-repo-url> myduit
cd myduit
```

4. **Setup Backend**

```bash
cd ~/myduit/backend

# Install dependencies
npm install

# Create environment file
cat > .env << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL="file:./prod.db"
EOF

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build TypeScript
npm run build

# Seed database
npm run db:seed

# Start backend (keep terminal open)
npm start
```

5. **Setup Frontend (in a new terminal)**

```bash
# Open new SSH connection
ssh user@your-server-ip

cd ~/myduit/frontend

# Install dependencies
npm install

# Create environment file
cat > .env.production << EOF
NEXT_PUBLIC_API_URL=http://your-server-ip:3001
EOF

# Build
npm run build

# Start frontend (keep terminal open)
npm start
```

6. **Access your app**

- Frontend: `http://your-server-ip:3000`
- Backend API: `http://your-server-ip:3001`

### Keep Services Running (use screen or tmux)

**Using screen:**

```bash
# Install screen
sudo apt install screen

# Backend in screen
screen -S backend
cd ~/myduit/backend
npm start
# Press Ctrl+A then D to detach

# Frontend in screen
screen -S frontend
cd ~/myduit/frontend
npm start
# Press Ctrl+A then D to detach

# List running screens
screen -ls

# Reattach to a screen
screen -r backend
screen -r frontend
```

**Using tmux:**

```bash
# Install tmux
sudo apt install tmux

# Start tmux session
tmux new -s myduit

# Split window: Ctrl+B then "
# Switch panes: Ctrl+B then arrow keys

# Top pane - Backend
cd ~/myduit/backend
npm start

# Bottom pane - Frontend (Ctrl+B then arrow down)
cd ~/myduit/frontend
npm start

# Detach: Ctrl+B then D
# Reattach: tmux attach -t myduit
```

---

## Option 2: With PM2 (Better for Hackathon Demo - 10 minutes)

PM2 keeps your apps running even if you close the terminal.

### Steps

1. **Install PM2**

```bash
sudo npm install -g pm2
```

2. **Setup Backend**

```bash
cd ~/myduit/backend
npm install
npm run build

# Create .env file
cat > .env << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL="file:./prod.db"
EOF

npx prisma generate
npx prisma migrate deploy
npm run db:seed
```

3. **Setup Frontend**

```bash
cd ~/myduit/frontend
npm install
npm run build

# Create .env.production
cat > .env.production << EOF
NEXT_PUBLIC_API_URL=http://your-server-ip:3001
EOF
```

4. **Start with PM2**

```bash
# Start Backend
cd ~/myduit/backend
pm2 start npm --name "backend" -- start

# Start Frontend
cd ~/myduit/frontend
pm2 start npm --name "frontend" -- start

# Save PM2 list
pm2 save
```

5. **Useful PM2 Commands**

```bash
# Check status
pm2 status

# View logs
pm2 logs

# Stop services
pm2 stop all

# Restart services
pm2 restart all

# Remove all services
pm2 delete all
```

---

## Option 3: Quick Docker Deploy (if Docker is available)

### Create docker-compose.yml

```yaml
version: "3.8"
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./prod.db
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: sh -c "npm install && npx prisma generate && npx prisma migrate deploy && npm run build && npm start"

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    command: sh -c "npm install && npm run build && npm start"
    depends_on:
      - backend
```

### Deploy

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find what's using port 3000
sudo lsof -i :3000
# Kill the process
sudo kill -9 <PID>

# Or use different ports
# Backend: PORT=3002 npm start
# Frontend: PORT=3001 npm start
```

### Can't Access from Outside

```bash
# Open firewall ports
sudo ufw allow 3000
sudo ufw allow 3001

# Or on Windows Server
netsh advfirewall firewall add rule name="Node 3000" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Node 3001" dir=in action=allow protocol=TCP localport=3001
```

### Build Errors

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf .next dist
npm run build
```

---

## Quick Checklist for Demo

- [ ] Backend running on port 3001
- [ ] Frontend running on port 3000
- [ ] Firewall allows ports 3000 and 3001
- [ ] Database seeded with demo data
- [ ] Can access `http://server-ip:3000` from browser
- [ ] API works at `http://server-ip:3001/health`

---

## Super Quick One-Liner Deploy

If you're in a rush:

```bash
# Backend (terminal 1)
cd backend && npm install && npm run build && npx prisma generate && npx prisma migrate deploy && npm run db:seed && npm start

# Frontend (terminal 2)
cd frontend && npm install && npm run build && npm start
```

---

## Pro Tips for Hackathon

1. **Test locally first** - Make sure everything works on your machine
2. **Use screen/tmux** - So you can close your laptop and services keep running
3. **Note your server IP** - You'll need to give this to judges
4. **Keep logs visible** - `pm2 logs` or check terminal output
5. **Have a backup plan** - Maybe deploy to Vercel/Render as backup

## Free Hosting Options (Backup Plan)

If server deployment fails:

- **Vercel** (Frontend) - Just push to GitHub and connect
- **Railway.app** (Backend) - Free tier, auto-deploy from GitHub
- **Render.com** (Both) - Free tier for both services

---

Good luck with your hackathon! 🎉
