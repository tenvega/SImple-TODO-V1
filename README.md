# Task Manager with AI Insights

A comprehensive task management application that combines traditional task tracking with AI-powered insights and analytics.

## Core Features

### Task Management
- Create, update, and delete tasks
- Set priorities, due dates, and tags
- Track task completion status
- Add descriptions and notes
- Monitor time spent on tasks

### Pomodoro Timer
- Integrated 25/5 minute Pomodoro timer
- Task-specific time tracking
- Break time management
- Session history tracking

### Analytics Dashboard
- Task completion rates
- Time distribution analysis
- Priority-based insights
- Tag-based grouping
- Pomodoro session effectiveness
- Late vs. on-time completion tracking

### AI Integration
- Productivity insights using Google's Gemini API
- Pattern recognition in task completion
- Personalized productivity recommendations
- Time management suggestions

## Technical Architecture

### Frontend
- Vanilla JavaScript with modular components
- Chart.js for data visualization
- Custom CSS with theme support
- Event-driven state management

### Backend
- Node.js with Express
- MongoDB for data persistence
- JWT authentication
- RESTful API design

### Integration
- Google Gemini API for AI insights
- MongoDB Atlas for cloud database
- CORS-enabled API endpoints
- Secure environment configuration

## User Flow
1. Authentication (login/register)
2. Task Management Dashboard
3. Pomodoro Timer Integration
4. Analytics & Insights View
5. AI-Powered Recommendations

## Analytics Capabilities
- Task completion metrics
- Time tracking analysis
- Productivity patterns
- Pomodoro effectiveness
- Due date compliance
- Priority distribution
- Tag-based insights

## AI Integration
- Task pattern analysis
- Productivity recommendations
- Time management insights
- Completion rate predictions
- Workload optimization suggestions

## Features

- Task Management
  - Create, edit, and delete tasks
  - Set priorities and due dates
  - Add tags for organization
  - Track completion status

- Pomodoro Timer
  - 25-minute work sessions
  - 5-minute short breaks
  - 15-minute long breaks
  - Task integration
  - Visual progress tracking

- Analytics Dashboard
  - Task completion metrics
  - Time tracking analysis
  - Priority and tag distribution
  - Performance comparisons
  - AI-powered productivity insights

- User Authentication
  - Secure login/registration
  - JWT-based authentication
  - Profile management

## Tech Stack

- Frontend:
  - Vanilla JavaScript (ES6+)
  - Chart.js for data visualization
  - CSS3 with modern features
  - Responsive design

- Backend:
  - Node.js & Express
  - MongoDB with Mongoose
  - JWT authentication
  - Google AI Studio (Gemini API)

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd task-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   API_URL=http://localhost:3000/api
   JWT_SECRET=your_jwt_secret_here
   GEMINI_API_KEY=your_gemini_api_key_here
   MONGODB_URI=your_mongodb_uri_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `API_URL`: Base URL for the backend API
- `JWT_SECRET`: Secret key for JWT token generation
- `GEMINI_API_KEY`: API key from Google AI Studio
- `MONGODB_URI`: MongoDB connection string

## API Integration

### Google AI Studio (Gemini)

The application uses Gemini API for generating productivity insights. To set up:

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add the key to your `.env` file

### MongoDB

1. Create a MongoDB Atlas cluster or use a local MongoDB instance
2. Add the connection string to your `.env` file
3. The application will automatically create the required collections

## Development

- Frontend code is in the `src` directory
- Backend code is in the `server` directory
- Components are modular and follow a consistent pattern
- Styles use CSS variables for theming
- Authentication is handled via JWT tokens

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details 