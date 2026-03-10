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
set JWT\_SECRET=myVeryLongSecretKey256BitsMinimumForSecurity
set MAIL\_USERNAME=yourapp@gmail.com  
set MAIL\_PASSWORD=your-gmail-app-password
mvn spring-boot:run

Backend runs at: http://localhost:8080
Swagger UI: http://localhost:8080/swagger-ui.html

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

