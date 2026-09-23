# 🌐 MedCore HMS - Online Cloud Deployment Guide

This guide explains how to deploy your **MedCore Hospital Management System (DBMS)** online so that anyone can access it via a public URL with a live, persistent database.

---

## ⚡ Option 1: Deploy for Free on Render.com (Recommended - 5 Minutes)

[Render](https://render.com) provides free hosting for Node.js web services with HTTPS and public `.onrender.com` domains.

### Step 1: Push Project to GitHub
1. Initialize git in your project directory:
   ```bash
   cd /Users/soul_beast/Documents/DBMS/hospital-management-system
   git init
   git add .
   git commit -m "Initial commit of MedCore HMS Full-Stack"
   ```
2. Create a new repository on [GitHub](https://github.com/new).
3. Push your repository:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy on Render
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** ➔ **Web Service**.
3. Connect your GitHub repository.
4. Fill in the service configuration:
   - **Name**: `medcore-hms`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node db/seed.js && node index.js`
   - **Plan**: `Free`
5. Click **Create Web Service**.
6. Render will automatically build the service and output a public live URL:
   `https://medcore-hms.onrender.com`

---

## 🚂 Option 2: Deploy on Railway.app

1. Go to [Railway.app](https://railway.app) and create an account.
2. Click **New Project** ➔ **Deploy from GitHub repo**.
3. Select your repository.
4. Under **Settings**:
   - Set **Root Directory** to `/server`.
   - Set **Start Command** to `node db/seed.js && node index.js`.
5. Under **Networking**, click **Generate Domain** to get a public URL like `https://medcore-hms.up.railway.app`.

---

## 🐳 Option 3: Deploy with Docker

A production multi-stage [`Dockerfile`](file:///Users/soul_beast/Documents/DBMS/hospital-management-system/Dockerfile) is included:

```bash
# Build the container image
docker build -t medcore-hms .

# Run the container locally or on any cloud VPS (DigitalOcean, AWS, GCP)
docker run -p 5001:5001 -e PORT=5001 medcore-hms
```

Visit `http://localhost:5001` or your VPS public IP.

---

## 💻 Local Testing & Demonstration

To run and present the system locally:

```bash
cd server
npm start
```

Visit **`http://localhost:5001`** in your browser to access:
- **Executive Operations Dashboard**: `http://localhost:5001/`
- **Patients & EHR Registry**: `http://localhost:5001/patients`
- **Doctor & Staff OPD Scheduling**: `http://localhost:5001/doctors`
- **Inpatient Ward & Bed Capacity Tracker**: `http://localhost:5001/wards`
- **Pharmacy & Billing System**: `http://localhost:5001/billing`
- **Database Schema & ER Architecture**: `http://localhost:5001/schema`
- **Live SQL Query Console & Audit Logs**: `http://localhost:5001/sql-console`
