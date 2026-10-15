# DialysisCareConnect

A web-based application designed to simplify dialysis appointment scheduling and patient communication. Nursing staff can schedule dialysis appointments by selecting the appointment date and time, and the system sends an automated WhatsApp notification to the patient.

## Features

- **Appointment Scheduling:** Allows nursing staff to schedule dialysis appointments for patients.
- **WhatsApp Notifications:** Automatically sends appointment details to patients through WhatsApp.
- **Appointment Management:** Stores appointment records in a database for future reference.
- **Patient Information:** Uses patient details to deliver relevant appointment notifications.
- **Simplified Workflow:** Reduces manual communication and helps minimize appointment scheduling errors.

## How It Works

1. Nursing staff selects a patient.
2. The appointment date and time are entered.
3. The appointment details are saved in the database.
4. The system triggers the WhatsApp messaging API.
5. The patient receives a WhatsApp message containing their appointment details.

## Technology Stack

Update this section to match the technologies used in your implementation.

- **Frontend:** React.js
- **Backend:** Node.js and Express.js
- **Database:** Microsoft SQL Server
- **Messaging:** WhatsApp Business messaging API through Pinbot

## Project Structure

```text
DialysisCareConnect/
┣ 📂backend
┃ ┣ 📂src
┃ ┃ ┣ 📂config
┃ ┃ ┃ ┗ 📜db.js
┃ ┃ ┣ 📂controllers
┃ ┃ ┃ ┣ 📜patientController.js
┃ ┃ ┃ ┣ 📜user.controller.js
┃ ┃ ┃ ┗ 📜whatsappController.js
┃ ┃ ┣ 📂middlewares
┃ ┃ ┣ 📂models
┃ ┃ ┃ ┗ 📜user.model.js
┃ ┃ ┣ 📂routes
┃ ┃ ┃ ┣ 📜patientRoutes.js
┃ ┃ ┃ ┣ 📜user.route.js
┃ ┃ ┃ ┗ 📜whatsappRoutes.js
┃ ┃ ┣ 📂services
┃ ┃ ┃ ┗ 📜user.service.js
┃ ┃ ┣ 📂utils
┃ ┃ ┗ 📜index.js
┃ ┣ 📜.env
┃ ┣ 📜.gitignore
┃ ┗ 📜package.json
┣ 📂frontend
┃ ┣ 📂public
┃ ┃ ┗ 📜dialysis-machine.png
┃ ┣ 📂src
┃ ┃ ┣ 📂assets
┃ ┃ ┣ 📜App.css
┃ ┃ ┣ 📜App.jsx
┃ ┃ ┣ 📜index.css
┃ ┃ ┗ 📜main.jsx
┃ ┣ 📜.gitignore
┃ ┣ 📜.oxlintrc.json
┃ ┣ 📜index.html
┃ ┣ 📜package.json
┃ ┣ 📜README.md
┃ ┗ 📜vite.config.js
┗ 📜README.md

```

*The directory structure above is illustrative; adjust it to match your actual project.*

## Installation and Setup

### Prerequisites

- Node.js and npm
- Microsoft SQL Server
- Access to the WhatsApp messaging API
- Git

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd DialysisAppointmentSystem
```

### 2. Configure the Backend

Navigate to the backend directory and install the dependencies:

```bash
cd server
npm install
```

Create a `.env` file and configure the required environment variables:

```env
PORT=5000

DB_SERVER=your_database_server
DB_DATABASE=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_PORT=1433
DB_ENCRYPT=false

WHATSAPP_API_URL=https://partners.pinbot.ai/v1/messages
WHATSAPP_API_KEY=your_api_key
WHATSAPP_NUMBER=your_whatsapp_number
```

Use the actual environment variable names expected by your application. Never commit real API keys, database passwords, or other credentials to GitHub.

### 3. Configure the Database

Create the required database and appointment table in SQL Server. Configure the database connection using the environment variables above.

### 4. Start the Backend

```bash
npm run dev
```

Use the start command defined in your backend's `package.json` if it differs.

### 5. Start the Frontend

Open another terminal, navigate to the frontend directory, and install the dependencies:

```bash
cd client
npm install
npm run dev
```

Open the local URL displayed by the frontend development server.

## Security Considerations

- Keep API credentials and database passwords in environment variables.
- Add `.env` files to `.gitignore`.
- Validate appointment details before saving them.
- Protect patient information and restrict access to authorized staff.
- Handle messaging failures and prevent duplicate notifications.
- Follow applicable healthcare data protection requirements.

## Future Enhancements

- Appointment rescheduling and cancellation.
- Automated appointment reminders.
- Appointment history and reporting.
- Admin and nursing staff authentication.
- Notification delivery status tracking.

## License

Choose an appropriate license before making the project available for reuse.
