# Prime Medical — Local Setup Guide

## Prerequisites

* Java 17
* Maven 3.8+
* Node.js 18+
* MySQL 8.0

## Database Setup

1. Start MySQL:

```sql
mysql -u root -p
```

2. Create the database:

```sql
CREATE DATABASE primemedical_db CHARACTER SET utf8mb4;
```

3. Import data if needed:

```bash
mysql -u root -p primemedical_db < primemedical_db.sql
```

## Backend

1. Change to the backend folder:

```bash
cd backend
```

2. Set environment variables (Windows PowerShell example):

```powershell
$env:JWT_SECRET = "myVeryLongSecretKey256BitsMinimumForSecurity"
$env:MAIL_USERNAME = "yourapp@gmail.com"
$env:MAIL_PASSWORD = "your-gmail-app-password"
$env:MAIL_FROM = "yourapp@gmail.com"
```

For Command Prompt use `set` instead of PowerShell environment assignment.

3. Run the backend:

```bash
mvn spring-boot:run
```

Backend runs at: http://localhost:8080
Swagger UI: http://localhost:8080/swagger-ui.html

> Notes:
> - Gmail accounts should use an App Password for `MAIL_PASSWORD`.

## Frontend

1. Change to the frontend folder:

```bash
cd frontend
```

2. Install dependencies and start the app:

```bash
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

## Notification Re-Verify

1. Start the backend and confirm startup logs show:
   - `Email notifications enabled with sender:`
   - `SMS notifications enabled.`
2. Register a new account and verify:
   - confirmation email is received
   - confirmation SMS is received
3. Book and cancel an appointment, then verify both channels.
4. Record a payment, then verify both channels.
5. Delete a patient account, then verify both channels.

## Test Login Credentials

All passwords: `Password123!`

| Role         | Email                      |
|--------------|----------------------------|
| Doctor       | doctor@primemedical.lk      |
| Nurse        | nurse@primemedical.lk       |
| Receptionist | reception@primemedical.lk   |
| Pharmacist   | pharmacist@primemedical.lk  |
| Patient      | patient@primemedical.lk     |
| Admin        | admin@primemedical.lk       |
