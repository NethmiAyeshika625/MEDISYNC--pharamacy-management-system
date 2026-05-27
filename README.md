# MEDISYNC

MEDISYNC is a full-stack pharmacy platform starter built with React, Node.js, MongoDB, Docker, and Tailwind CSS.

## Roles

- Patient: search nearby pharmacies, view public pharmacy and pharmacist details, upload prescriptions, track approval status, pay for orders, rate pharmacies, and manage profile cards.
- Pharmacist: receive prescriptions in real time, review and approve or reject them, prepare orders, update delivery or pickup status, and manage inventory.
- Admin: manage pharmacies, users, approvals, and platform visibility.

## Stack

- Frontend: React + Vite + Tailwind CSS + Socket.IO client
- Backend: Node.js + Express + MongoDB + Mongoose + Socket.IO
- Containerization: Docker + Docker Compose

## Start with Docker

1. Copy `.env.example` to `.env` if you want local overrides.
2. Run `docker compose up --build`.
3. Open the frontend at `http://localhost:5173` and the API at `http://localhost:5000`.

## Local development

- Backend: `cd backend && npm install && npm run dev`
- Frontend: `cd frontend && npm install && npm run dev`

## What is scaffolded

- JWT auth with role-based guards
- Pharmacy search by name and location
- Public pharmacy detail view with non-sensitive pharmacist data and medicine availability previews
- Prescription upload and status tracking
- Realtime patient-pharmacist updates through Socket.IO
- Pickup or delivery order flow with payment placeholders
- Pharmacy feedback and rating flow

This is a starter scaffold, not a finished production system. It is structured so the next iteration can focus on business rules, validation, payments, and deployment.
