# Prime Medical — Local Setup Guide

## Prerequisites

* Java 17
* Maven 3.8+
* Node.js 18+
* MySQL 8.0

## Database Setup

mysql -u root -p
CREATE DATABASE primemedical\_db CHARACTER SET utf8mb4;

## Backend

cd backend

mvn spring-boot:run

Backend runs at: http://localhost:8080
Swagger UI: http://localhost:8080/swagger-ui.html

Notes:
- Gmail accounts should use an App Password for `MAIL_PASSWORD`.

## Notification Re-Verify

1. Start backend and check startup logs:
	- `Email notifications enabled with sender:`
	- `SMS notifications enabled:
2. Trigger a registration and confirm:
	- Confirmation email received
	- Confirmation SMS received
3. Book and cancel an appointment, then check both channels.
4. Record a payment, then check both channels.
5. Delete a patient account, then check both channels.

## Frontend

cd frontend
npm install
npm run dev

Frontend runs at: http://localhost:5173

## Test Login Credentials (all passwords: Password123!)

|Role         |Email                      |
|-------------|---------------------------|
|Doctor       |doctor@primemedical.lk     |
|Nurse        |nurse@primemedical.lk      |
|Receptionist |reception@primemedical.lk  |
|Pharmacist   |pharmacist@primemedical.lk |
|Patient      |patient@primemedical.lk    |
|Admin        |admin@primemedical.lk      |
