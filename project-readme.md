# Task Dashboard

A productivity-focused task management application built with vanilla JavaScript. Features include task management, Pomodoro timer, analytics dashboard, and user authentication.

## Features

### Task Management
- Create, edit, and delete tasks
- Task prioritization (high, medium, low)
- Due dates and notifications
- Task tagging for better organization
- Mark tasks as complete/incomplete

### Pomodoro Timer
- 25-minute work sessions
- 5-minute short breaks
- 15-minute long breaks after 4 sessions
- Link timer to specific tasks
- Time tracking for analytics

### Analytics Dashboard
- Task completion metrics
- Time tracking analysis
- Tag and priority distribution
- Comparison with previous periods
- AI-powered productivity insights

### User Authentication
- Secure registration and login
- JWT-based authentication
- Protected API routes
- User profile management

## Technical Implementation

### Frontend
- Vanilla JavaScript without frameworks
- Component-based architecture
- Chart.js for data visualization
- Modern UI with chadcn styling
- Responsive design for all devices

### Backend
- Node.js with Express.js
- MongoDB for data storage
- RESTful API design
- JWT authentication
- Google Vertex AI integration (Gemini)

### Security Features
- Secure password hashing with bcrypt
- JWT for stateless authentication
- CORS protection
- Request validation
- Helmet.js for security headers

## Project Structure

```
├── backend/
│   ├── server.js              # Express application entry point
│   ├── models/                # MongoDB schemas
│   ├── routes/                # API routes
│   └── middleware/            # Authentication middleware
├── frontend/
│   ├── index.html             # Main HTML file
│   ├── assets/                # Styles and assets
│   │   └── styles/            # CSS files
│   └── src/                   # JavaScript source files
│       ├── app.js             # Main application entry point
│       ├── components/        # UI components
│       ├── services/          # Data and API services
│       └── utils/             # Utility functions
```

## Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/task-dashboard.git
cd task-dashboard
```

2. Set up the backend:
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

3. Set up the frontend:
```bash
cd ../frontend
# No build step needed, it's vanilla JS!
```

4. Start the backend server:
```bash
cd backend
npm start
```

5. Open the frontend in your browser:
```bash
cd ../frontend
# Use Live Server or any static file server
```

## Development Approach

This project demonstrates how modern web applications can be built without relying on heavy frameworks. Key aspects of the development approach include:

1. **Component-Based Architecture**: Even without React or Vue, the code is organized into reusable components with clear responsibilities.

2. **Service Layer Pattern**: Data fetching, authentication, and storage are abstracted into service classes.

3. **Progressive Enhancement**: The app works with localStorage when offline and syncs with the backend when connected.

4. **Modular JavaScript**: ES modules are used to organize code and manage dependencies.

5. **API-First Design**: The frontend and backend are completely decoupled, communicating only through the RESTful API.

## AI Integration

The project includes integration with Google's Gemini AI via the Vertex AI API to provide personalized productivity insights based on task and time tracking data. This demonstrates a practical use case for AI in everyday productivity applications.

## Future Enhancements

- Subtasks and task dependencies
- Calendar view integration
- Team collaboration features
- Data export and import
- Mobile application with PWA support

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Chart.js](https://www.chartjs.org/) for data visualization
- [Google Vertex AI](https://cloud.google.com/vertex-ai) for AI insights
- [chadcn/ui](https://ui.shadcn.com/) for design inspiration
