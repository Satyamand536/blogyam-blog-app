# Blogyam Blog Application

A full-stack MERN (MongoDB, Express, React, Node.js) blog application with advanced features like AI curation, meme generation, and user nominations.

# Live Demo (https://blogyam-blog-app-4.onrender.com/)

## Features

- **User Authentication**: Secure signup and login.
- **Blog Management**: Create, edit, and delete blog posts.
- **AI Curation**: "Supreme" and "Elite" picks curated by logic/AI.
- **Meme Generator**: Create memes securely within the app.
- **Nominations**: Weekly user nomination system for blogs.
- **Commenting System**: Interactive comments with moderation.
- **Dashboard**: User dashboard to manage posts and nominations.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (Local or Atlas URI)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd project5-Blog Application
    ```

2.  **Install Backend Dependencies:**

    ```bash
    cd backend
    npm install
    ```

3.  **Install Client Dependencies:**

    ```bash
    cd ../client
    npm install
    ```

### Configuration

Create a `.env` file in the `backend` directory with the following variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
# Add other necessary variables here
```

### Running the Application

1.  **Start the Backend:**

    ```bash
    cd backend
    npm start
    ```

2.  **Start the Frontend:**

    ```bash
    cd client
    npm run dev
    ```

    The frontend will typically run on `http://localhost:5173` and the backend on `http://localhost:5000`.

## Directory Structure

- `client/`: Frontend React application
- `backend/`: Backend Node.js/Express application

## Contributing

1.  Fork the repository
2.  Create your feature branch (`git checkout -b feature/amazing-feature`)
3.  Commit your changes (`git commit -m 'Add some amazing feature'`)
4.  Push to the branch (`git push origin feature/amazing-feature`)
5.  Open a Pull Request


