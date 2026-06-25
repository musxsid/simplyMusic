# 🎧 simplyMusic - Event-Driven Audio Microservices

A distributed, enterprise-grade music streaming and cataloging platform built with **Spring Boot**, **React**, and an asynchronous **RabbitMQ** event-driven architecture. 

Unlike standard monolithic CRUD applications, simplyMusic is designed for fault tolerance and scalability. It separates heavy media streaming, real-time analytics, and user authentication into isolated, independent microservices running in Docker.

## ✨ Core Architecture & Data Flow

The system is built on a decoupled microservices architecture to ensure high availability and prevent performance bottlenecks during large file uploads.

1. **Authentication (Keycloak):** All endpoints are secured behind Keycloak Identity Access Management (IAM). Users receive secure JWTs to access the platform.
2. **Main API Gateway (Spring Boot):** Intercepts requests, validates JWTs, and handles the orchestration of uploads. 
3. **Split Storage Strategy:** - Heavy binary `.mp3` files are streamed directly into a self-hosted **MinIO** (S3-compatible) object storage vault.
   - Lightweight track metadata (Title, Artist, Duration) is saved to **MongoDB** for rapid indexing and retrieval.
4. **Asynchronous Event Bus (RabbitMQ):** Once an upload or play event occurs, the Main API fires a message into RabbitMQ and immediately responds to the user.
5. **Analytics Service:** An isolated Spring Boot microservice that listens to the RabbitMQ message broker. It independently tracks play counts and library metrics in its own database without adding computational load to the main streaming server.

## 🛠️ Tech Stack

**Frontend**
* React.js (Vite)
* Tailwind CSS
* Lucide React (Icons)
* Axios / Fetch API

**Backend & Infrastructure**
* Java 17+ / Spring Boot 3
* Spring Security (OAuth2 / JWT Resource Server)
* Docker & Docker Compose
* MinIO (Object Storage)
* MongoDB (NoSQL Database)
* RabbitMQ (Message Broker)
* Keycloak (Identity & Access Management)

## 🚀 Getting Started

To run this project locally, you will need **Docker** and **Java (JDK)** installed on your machine.

### 1. Boot up the Infrastructure
Navigate to the root directory and start the core infrastructure components (Keycloak, MinIO, MongoDB, RabbitMQ) using Docker Compose:
```bash
docker-compose up -d
