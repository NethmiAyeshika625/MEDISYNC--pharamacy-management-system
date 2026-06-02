# MEDISYNC Production Deployment Guide

Complete guide for deploying MEDISYNC to production using Docker, PM2, or traditional server setup.

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Docker Compose Deployment](#docker-compose-deployment)
3. [Traditional Server Deployment (PM2)](#traditional-server-deployment-pm2)
4. [Environment Configuration](#environment-configuration)
5. [Nginx Reverse Proxy](#nginx-reverse-proxy)
6. [SSL/TLS Configuration](#ssltls-configuration)
7. [Database Backup](#database-backup)
8. [Monitoring & Logs](#monitoring--logs)
9. [Scaling](#scaling)

## Pre-Deployment Checklist

### Security
- [ ] Change all default passwords and secrets
- [ ] Set strong JWT_SECRET (32+ characters)
- [ ] Obtain SSL/TLS certificates
- [ ] Configure CORS for production domains
- [ ] Set NODE_ENV=production
- [ ] Disable debug logging in production
- [ ] Secure MongoDB with authentication
- [ ] Configure firewall rules

### Infrastructure
- [ ] Rent server/VPS (AWS EC2, DigitalOcean, Linode, etc.)
- [ ] Configure domain DNS records
- [ ] Set up log rotation
- [ ] Plan backup strategy
- [ ] Ensure at least 2GB RAM, 20GB disk

### Third-Party Services
- [ ] Stripe account and API keys
- [ ] Email service (SendGrid, AWS SES, etc.)
- [ ] MongoDB Atlas account (if not self-hosted)
- [ ] CDN (Cloudflare optional)

### Application
- [ ] All tests passing
- [ ] Database migrations tested
- [ ] Build verified (npm run build)
- [ ] Environment variables documented
- [ ] API endpoints tested

## Docker Compose Deployment

### Quick Start

1. **Prepare Server**
   ```bash
   # SSH into your server
   ssh root@your.server.ip
   
   # Update system
   apt-get update && apt-get upgrade -y
   
   # Install Docker and Docker Compose
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Add current user to docker group
   usermod -aG docker $USER
   ```

2. **Clone Repository**
   ```bash
   cd /var/www
   git clone https://github.com/your-org/medisync.git
   cd medisync
   ```

3. **Configure Environment**
   ```bash
   # Copy example files
   cp backend/.env.production.example backend/.env.production
   cp frontend/.env.production.example frontend/.env.production
   
   # Edit with your values
   nano backend/.env.production
   nano frontend/.env.production
   ```

4. **Deploy with Docker Compose**
   ```bash
   # Build and start all services
   docker-compose up -d
   
   # Check status
   docker-compose ps
   
   # View logs
   docker-compose logs -f backend
   docker-compose logs -f frontend
   
   # Seed database
   docker-compose exec backend npm run seed
   ```

5. **Access Application**
   - Frontend: `http://your.server.ip:5173`
   - Backend API: `http://your.server.ip:5000`

### Docker Compose Useful Commands

```bash
# View logs
docker-compose logs backend -f

# Restart services
docker-compose restart backend
docker-compose restart frontend

# Stop all services
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Scale services
docker-compose up -d --scale backend=3

# Execute command in container
docker-compose exec backend npm run seed

# Update to latest images
docker-compose pull
docker-compose up -d
```

## Traditional Server Deployment (PM2)

### Setup Node Environment

1. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   node --version
   npm --version
   ```

2. **Install PM2 Globally**
   ```bash
   sudo npm install -g pm2
   pm2 install pm2-logrotate
   ```

3. **Clone and Setup**
   ```bash
   cd /var/www
   git clone https://github.com/your-org/medisync.git
   cd medisync
   
   # Copy environment files
   cp backend/.env.production.example backend/.env
   nano backend/.env  # Edit with your values
   
   cp frontend/.env.production.example frontend/.env
   nano frontend/.env
   ```

4. **Build Frontend**
   ```bash
   cd frontend
   npm ci --production
   npm run build
   cd ..
   ```

5. **Install Backend Dependencies**
   ```bash
   cd backend
   npm ci --production
   cd ..
   ```

6. **Start with PM2**
   ```bash
   # Start using ecosystem config
   pm2 start ecosystem.config.js --env production
   
   # Or start individually
   pm2 start "npm run start" --name medisync-api --cwd backend
   pm2 start "npm run preview" --name medisync-web --cwd frontend
   
   # Save and startup on reboot
   pm2 save
   pm2 startup
   
   # Verify services running
   pm2 status
   pm2 logs medisync-api
   ```

### PM2 Management Commands

```bash
# Monitor
pm2 monit

# View logs
pm2 logs medisync-api
pm2 logs medisync-web

# Restart
pm2 restart medisync-api
pm2 restart medisync-web

# Reload (zero downtime)
pm2 reload medisync-api

# Stop
pm2 stop medisync-api
pm2 stop all

# Delete
pm2 delete medisync-api
pm2 delete all
```

## Environment Configuration

### Backend (.env.production)

```bash
# Essential
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/medisync
JWT_SECRET=your-32-character-random-string-here
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=https://yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Email (Optional)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com

# Logging
LOG_LEVEL=info
```

### Frontend (.env.production)

```bash
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_STRIPE_PUBLIC_KEY=pk_live_...
VITE_ENABLE_GEOLOCATION=true
VITE_ENABLE_NOTIFICATIONS=true
```

## Nginx Reverse Proxy

### Setup Nginx

1. **Install Nginx**
   ```bash
   sudo apt-get install nginx
   sudo systemctl enable nginx
   sudo systemctl start nginx
   ```

2. **Create Site Configuration**
   ```bash
   sudo nano /etc/nginx/sites-available/medisync
   ```

3. **Add Configuration**
   ```nginx
   # Redirect HTTP to HTTPS
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       return 301 https://$server_name$request_uri;
   }

   # Main HTTPS server
   server {
       listen 443 ssl http2;
       server_name yourdomain.com www.yourdomain.com;

       # SSL Certificates (Let's Encrypt)
       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
       
       # SSL Settings
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers HIGH:!aNULL:!MD5;
       ssl_prefer_server_ciphers on;
       ssl_session_cache shared:SSL:10m;
       ssl_session_timeout 10m;

       # Security Headers
       add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header X-Frame-Options "DENY" always;
       add_header X-XSS-Protection "1; mode=block" always;

       # API Proxy
       location /api/ {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_connect_timeout 60;
           proxy_send_timeout 60;
           proxy_read_timeout 60;
       }

       # Static Frontend
       location / {
           proxy_pass http://localhost:5173;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }

       # Gzip compression
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
       gzip_vary on;
       gzip_comp_level 6;
   }
   ```

4. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/medisync /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## SSL/TLS Configuration

### Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renew
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

## Database Backup

### MongoDB Backup

```bash
# Manual backup
mongodump --uri="mongodb://user:pass@host:27017/medisync" --out=/backups/medisync_$(date +%Y%m%d)

# Restore from backup
mongorestore --uri="mongodb://user:pass@host:27017" /backups/medisync_20231215/

# Automated backup (cron)
0 2 * * * mongodump --uri="mongodb://user:pass@host:27017/medisync" --out=/backups/medisync_$(date +\%Y\%m\%d)
```

### MongoDB Atlas Automated Backups

- Enable in Atlas dashboard
- Configure retention period (daily, weekly, monthly)
- Test restore procedures regularly

## Monitoring & Logs

### Application Logs

```bash
# PM2 logs
pm2 logs medisync-api
pm2 logs medisync-web --lines 100

# Docker logs
docker-compose logs backend -f
docker-compose logs frontend -f

# System logs
journalctl -u nginx -f
tail -f /var/log/auth.log
```

### Log Rotation

```bash
# PM2 logrotate (already installed)
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Monitoring Tools

**PM2 Plus** (Recommended for PM2 users)
```bash
pm2 web  # Start web dashboard on port 9615
# Or use pm2.io for cloud monitoring
```

**Prometheus + Grafana** (For Docker)
- Add monitoring services to docker-compose
- Scrape metrics from /metrics endpoint
- Create dashboards for key metrics

### Health Checks

```bash
# Backend health
curl -i http://localhost:5000/health

# Frontend
curl -i http://localhost:5173

# Database
mongosh --eval "db.adminCommand('ping')"
```

## Scaling

### Horizontal Scaling (Multiple Servers)

1. **Load Balancer Setup**
   - Use HAProxy or AWS ALB
   - Configure sticky sessions for Socket.io
   - Point to multiple backend instances

2. **Shared Database**
   - Use MongoDB Atlas for multi-region
   - Ensure replication enabled
   - Monitor primary node load

3. **Session Storage**
   - Use Redis for Socket.io adapters
   ```bash
   docker run -d -p 6379:6379 redis:latest
   ```

### Vertical Scaling (Bigger Server)

- Increase server RAM (for Node processes)
- Increase disk space
- Upgrade CPU for processing
- Monitor and upgrade MongoDB instance

### PM2 Cluster Mode (Single Server)

Already configured in `ecosystem.config.js`:
```javascript
instances: 'max',  // Use all CPU cores
exec_mode: 'cluster'
```

## Troubleshooting

### Services Not Starting

```bash
# Check logs
pm2 logs medisync-api
docker-compose logs backend

# Check port availability
netstat -tlnp | grep 5000
netstat -tlnp | grep 5173

# Free ports if needed
fuser -k 5000/tcp
```

### High Memory Usage

```bash
# Monitor memory
pm2 monit

# Check processes
ps aux | grep node

# Restart with memory limit
pm2 start ... --max-memory-restart 500M
```

### Database Connection Issues

```bash
# Test MongoDB connection
mongosh "mongodb+srv://user:pass@host/medisync"

# Check connection pool
# In backend logs, look for connection warnings
```

### Socket.io Disconnections

- Check firewall rules (port 5000 open)
- Verify CORS configuration
- Check reverse proxy WebSocket settings
- Monitor network latency

## Maintenance

### Regular Tasks

- [ ] Monitor disk space (weekly)
- [ ] Check database performance (weekly)
- [ ] Review logs for errors (daily)
- [ ] Test backup restoration (monthly)
- [ ] Update dependencies (monthly)
- [ ] Security patches (as released)

### Update Procedure

```bash
# Pull latest code
git pull origin main

# Test locally first
npm run build
npm test

# Deploy
pm2 reload medisync-api

# Or with Docker
docker-compose pull
docker-compose up -d
```

## Support

For deployment issues:
1. Check logs: `pm2 logs` or `docker-compose logs`
2. Verify environment variables are set
3. Test connectivity: `curl http://localhost:5000`
4. Check firewall rules
5. Verify database connection string

---

**Last Updated**: 2026-05-29
**Tested On**: Ubuntu 20.04 LTS, Ubuntu 22.04 LTS
