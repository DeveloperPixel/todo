# Python FastAPI Todo Application

A modern, lightweight Todo API built using Python, FastAPI, and SQLAlchemy. It features static frontend assets, support for PostgreSQL with an automated fallback to a local SQLite database, and is containerized for easy local development and cloud deployment.

---

## 🚀 Features

- **FastAPI Backend**: Fast, interactive API documentation (Swagger UI available at `/docs`).
- **Dual Database Support**: Connects to PostgreSQL via the `DATABASE_URL` environment variable, falling back to a local SQLite (`todo.db`) database if PostgreSQL is unavailable.
- **Static Frontend**: Serves a single-page Todo interface directly from the `static/` directory.
- **Docker Ready**: Fully containerized using a lightweight Alpine-based Python Docker image and orchestratable with Docker Compose.

---

## 🛠️ Step 1: Run and Test Locally

### Option A: Standard Python Execution (Fastest for Development)

1. **Set up a Virtual Environment**:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the FastAPI Server**:
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
   *Note: Since PostgreSQL is not running in this standalone mode, the app will log a fallback warning and automatically use local SQLite (`todo.db`).*

4. **Access the App**:
   - Web App: Open your browser to [http://localhost:8000](http://localhost:8000)
   - Swagger API Docs: Open your browser to [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option B: Docker Compose Execution (Recommended with PostgreSQL)

To test the application with a PostgreSQL database locally using container orchestration:

1. **Start the containers**:
   ```bash
   docker-compose up --build
   ```
   This command starts:
   - A PostgreSQL container named `todo_db` on port `5432`.
   - The FastAPI web container named `todo_web` mapped to port `8000` locally.

2. **Access the App**:
   - Open your browser to [http://localhost:8000](http://localhost:8000)

---

### Option C: Standalone Docker Container

1. **Build the Docker container image**:
   ```bash
   docker build -t fastapi-todo-app .
   ```
2. **Run the Docker container**:
   ```bash
   docker run -d -p 8080:80 --name todo-app fastapi-todo-app
   ```
3. **Access the App**:
   - Open your browser to [http://localhost:8080](http://localhost:8080)

---

## ☁️ Step 2: Deploy to AWS

This containerized application is well-suited for several AWS deployment options:

### Method 1: AWS App Runner (Easiest & Serverless)

AWS App Runner can deploy your app directly from a GitHub repository or a container registry (ECR).
1. Push your code to a public or private **GitHub Repository**.
2. Go to the **AWS App Runner Console** and click **Create Service**.
3. Choose **Repository source** and connect your GitHub account.
4. Select the repository and the branch (e.g., `main`).
5. Choose **Automatic** deployment trigger to redeploy on every push.
6. Configure the Build:
   - Runtime: **Python 3** (or select **Docker** to build from the `Dockerfile`).
   - If using Python runtime:
     - Build command: `pip install -r requirements.txt`
     - Start command: `uvicorn main:app --host 0.0.0.0 --port 80`
   - Port: `80`
7. Click **Deploy**. AWS App Runner will provide a secure HTTPS endpoint.

### Method 2: AWS ECS with Fargate (Advanced - Recommended for Production)

Deploy serverless containers inside AWS Elastic Container Service (ECS) with AWS Fargate.
1. **Push Image to Amazon ECR**:
   - Create a repository named `fastapi-todo-app` on the **Amazon ECR Console**.
   - Authenticate your local Docker daemon and push the image using the commands provided in the AWS console.
2. **Create an Amazon RDS PostgreSQL Database**:
   - Launch a Serverless or Free Tier PostgreSQL instance on RDS.
   - Configure security groups to allow access from the ECS tasks.
3. **Configure ECS Tasks**:
   - Create a **Task Definition** with launch type **Fargate**.
   - Set container port mappings to `80`.
   - Define environment variables, specifically `DATABASE_URL` pointing to your RDS PostgreSQL instance: `postgresql://username:password@rds-endpoint:5432/dbname`.
4. **Deploy in an ECS Cluster**:
   - Create a Cluster and run a Service using your task definition.
   - Attach an **Application Load Balancer (ALB)** to distribute traffic to your tasks.
