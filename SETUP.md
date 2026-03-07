# RxRoute - Complete Setup Guide

## Overview
RxRoute is a medication delivery app built with React Native and Expo, connected to a MongoDB backend.

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Expo CLI
- React Native development environment

## Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env` file and update with your settings
   - Make sure MongoDB URI is correct for your setup

4. **Seed the database with sample medications:**
   ```bash
   npm run seed
   ```

5. **Start the backend server:**
   ```bash
   npm run dev
   ```
   
   Backend will run on `http://localhost:5000`

## Frontend Setup

1. **Install frontend dependencies:**
   ```bash
   cd ..  # Back to root directory
   npm install
   ```

2. **Start the frontend:**
   ```bash
   npm start
   ```
   
   This will start the Expo development server.

## Features Implemented

### Backend API
- **Authentication:** Register, login, profile management
- **Medications:** Browse, search, filter, reviews
- **Orders:** Create, track, cancel orders
- **User Medications:** Personal medication tracking
- **Dashboard:** Medication adherence and reminders

### Frontend
- **Authentication flows:** Login, signup, profile
- **Medication catalog:** Browse and search medications
- **Shopping cart:** Add/remove items, checkout
- **Order tracking:** View order history and status
- **Medication management:** Personal medication tracker

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Medications
- `GET /api/medications` - Get medications (with filtering)
- `GET /api/medications/:id` - Get single medication
- `GET /api/medications/categories/all` - Get categories
- `POST /api/medications/:id/reviews` - Add review

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/cancel` - Cancel order

### User Medications
- `GET /api/users/medications` - Get user medications
- `POST /api/users/medications` - Add medication
- `PUT /api/users/medications/:id` - Update medication
- `PUT /api/users/medications/:id/taken` - Mark as taken

## Testing the Connection

1. **Start both servers** (backend on port 5000, frontend on port 19006)
2. **Test API health:** Visit `http://localhost:5000/api/health`
3. **Test registration:** Use the app to create a new account
4. **Browse medications:** View the catalog with seeded data

## Environment Configuration

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rxroute
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

### Frontend
The API base URL is configured in `services/api.ts`:
```typescript
const API_BASE_URL = 'http://localhost:5000/api';
```

## Production Considerations

1. **Security:**
   - Change JWT secret in production
   - Use HTTPS
   - Implement proper input validation
   - Add rate limiting

2. **Database:**
   - Use MongoDB Atlas for production
   - Set up proper indexing
   - Implement backup strategy

3. **Deployment:**
   - Deploy backend to cloud service (Heroku, AWS, etc.)
   - Build and publish mobile app to app stores
   - Set up proper CI/CD pipeline

## Troubleshooting

### Common Issues
1. **MongoDB connection:** Ensure MongoDB is running and URI is correct
2. **CORS errors:** Check CORS configuration in backend
3. **Token issues:** Clear AsyncStorage if having auth problems
4. **Network issues:** Ensure both frontend and backend are running

### Logs
- Backend logs show in terminal where server is running
- Frontend logs show in Expo development tools

## Next Steps

1. **Enhance features:**
   - Push notifications
   - Real-time order tracking
   - Payment integration
   - Prescription upload

2. **Improve UX:**
   - Add animations
   - Offline support
   - Better error handling
   - Performance optimization

3. **Scale:**
   - Add more medication data
   - Implement pharmacy network
   - Add delivery tracking
   - Scale infrastructure
