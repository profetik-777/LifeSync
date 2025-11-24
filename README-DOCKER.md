# LifeSync - Docker & GitHub Setup Guide

This guide will help you export your LifeSync project from Replit to GitHub and run it as a Docker container on any machine.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Part 1: Push to GitHub from Replit](#part-1-push-to-github-from-replit)
- [Part 2: Run with Docker](#part-2-run-with-docker)
- [Part 3: Development Setup](#part-3-development-setup)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### For GitHub Setup:
- A GitHub account
- Git configured in your Replit workspace (already available)

### For Docker Setup:
- Docker installed on your local machine ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed (included with Docker Desktop)

---

## Part 1: Push to GitHub from Replit

### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and log in
2. Click the **+** button in the top right → **New repository**
3. Name it `lifesync` (or any name you prefer)
4. Choose **Public** or **Private**
5. **Do NOT initialize** with README, .gitignore, or license
6. Click **Create repository**

### Step 2: Connect Replit to GitHub

In your Replit workspace, open the **Shell** (or use the existing terminal) and run:

```bash
# Initialize git (if not already initialized)
git init

# Add all files to git
git add .

# Create your first commit
git commit -m "Initial commit - LifeSync app with Docker support"

# Add your GitHub repository as remote
# Replace YOUR_USERNAME and YOUR_REPO with your actual GitHub username and repo name
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git push -u origin main
```

**Note:** If you get an authentication error, you may need to:
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token (classic) with `repo` scope
3. Use the token as your password when pushing

### Step 3: Verify on GitHub

1. Go to your GitHub repository URL
2. You should see all your project files including:
   - `Dockerfile`
   - `docker-compose.yml`
   - `.dockerignore`
   - `.env.example`
   - All source code

---

## Part 2: Run with Docker

### Option A: Using Docker Compose (Recommended)

Docker Compose will start both the app and PostgreSQL database automatically.

1. **Clone the repository** (on your local machine):
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd YOUR_REPO
   ```

2. **Create environment file** (optional):
   ```bash
   cp .env.example .env
   # Edit .env if you want to customize database credentials
   ```

3. **Start the application**:
   ```bash
   docker-compose up -d
   ```

4. **View logs** (optional):
   ```bash
   docker-compose logs -f app
   ```

5. **Access the application**:
   - Open your browser to: http://localhost:5000
   - The app should be running with a PostgreSQL database!

6. **Stop the application**:
   ```bash
   docker-compose down
   ```

   To also remove the database data:
   ```bash
   docker-compose down -v
   ```

### Option B: Using Docker Only (Without Database)

If you want to run just the app container:

1. **Build the Docker image**:
   ```bash
   docker build -t lifesync:latest .
   ```

2. **Run the container**:
   ```bash
   docker run -p 5000:5000 \
     -e DATABASE_URL="your_database_url_here" \
     lifesync:latest
   ```

3. **Access the application**:
   - Open your browser to: http://localhost:5000

---

## Part 3: Development Setup

### Local Development (Without Docker)

If you want to develop locally without Docker:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd YOUR_REPO
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env and add your DATABASE_URL
   ```

4. **Push database schema**:
   ```bash
   npm run db:push
   ```

5. **Run development server**:
   ```bash
   npm run dev
   ```

6. **Access the application**:
   - Open your browser to: http://localhost:5000

---

## Environment Variables

The following environment variables are used by the application:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Set in docker-compose | Yes |
| `NODE_ENV` | Environment mode | `production` | No |
| `PORT` | Port to run the server on | `5000` | No |
| `AUTO_MIGRATE` | Automatically run database migrations on startup | `true` | No |
| `OPENAI_API_KEY` | OpenAI API key (if using AI features) | - | No |

---

## Docker Commands Cheat Sheet

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart app

# Rebuild after code changes
docker-compose up -d --build

# Remove everything (including data)
docker-compose down -v

# Access app container shell
docker-compose exec app sh

# Access database
docker-compose exec postgres psql -U lifesync -d lifesync
```

---

## Troubleshooting

### Port Already in Use

If port 5000 is already in use, edit `docker-compose.yml`:

```yaml
services:
  app:
    ports:
      - "3000:5000"  # Change 3000 to any available port
```

### Disable Automatic Migrations (Production)

For production deployments, you may want to control when database migrations run. Edit `docker-compose.yml`:

```yaml
services:
  app:
    environment:
      - AUTO_MIGRATE=false  # Disable automatic migrations
```

Then run migrations manually when needed:
```bash
docker-compose exec app npm run db:push
```

### Database Connection Issues

1. Check if PostgreSQL is running:
   ```bash
   docker-compose ps
   ```

2. Check database logs:
   ```bash
   docker-compose logs postgres
   ```

3. Verify DATABASE_URL is correct in docker-compose.yml

### Build Failures

1. Clear Docker cache and rebuild:
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Can't Push to GitHub

1. Ensure you have the correct remote URL:
   ```bash
   git remote -v
   ```

2. If using HTTPS, you may need a Personal Access Token:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate new token with `repo` scope
   - Use token as password when pushing

---

## Updating Your Deployment

After making changes to your code:

### Update GitHub:
```bash
git add .
git commit -m "Description of changes"
git push
```

### Update Docker Container:
```bash
git pull                          # Pull latest changes
docker-compose up -d --build      # Rebuild and restart
```

---

## Production Deployment

For production deployment, consider:

1. **Use environment-specific .env files**
2. **Set up HTTPS** with a reverse proxy (Nginx, Caddy)
3. **Use managed PostgreSQL** (AWS RDS, Google Cloud SQL, etc.)
4. **Set up monitoring and logging**
5. **Configure backup strategies** for the database
6. **Use container orchestration** (Docker Swarm, Kubernetes) for scaling

**Note on Docker Image Size:**
The production Docker image includes all dependencies (including dev dependencies like `drizzle-kit`) to support automatic database migrations. This increases the image size by approximately 50-100MB but ensures migrations work correctly. If image size is a critical concern, you can:
- Set `AUTO_MIGRATE=false` and run migrations manually
- Create a separate migration service/container
- Use a managed database with manual migration control

---

## Project Structure

```
lifesync/
├── client/              # React frontend
├── server/              # Express backend
├── shared/              # Shared types and schemas
├── Dockerfile           # Docker build instructions
├── docker-compose.yml   # Docker services configuration
├── .dockerignore        # Files to exclude from Docker
├── .env.example         # Environment variables template
└── README-DOCKER.md     # This file
```

---

## Support

For issues related to:
- **LifeSync features**: Open an issue on GitHub
- **Docker setup**: Check Docker documentation
- **Replit specific**: Contact Replit support

---

## License

MIT
