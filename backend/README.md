# RxRoute Backend Setup

## Prerequisites
- Node.js installed on your machine
- MongoDB installed and running locally or MongoDB Atlas account

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rxroute
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

## Running the Backend

1. Start MongoDB (if running locally)

2. Start the backend server:
```bash
npm run dev
```

The backend will be running on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Medications
- `GET /api/medications` - Get all medications (with filtering)
- `GET /api/medications/:id` - Get single medication
- `GET /api/medications/categories/all` - Get all categories
- `POST /api/medications/:id/reviews` - Add review (requires auth)

### Orders
- `POST /api/orders` - Create new order (requires auth)
- `GET /api/orders` - Get user orders (requires auth)
- `GET /api/orders/:id` - Get single order (requires auth)
- `PUT /api/orders/:id/cancel` - Cancel order (requires auth)

### User Medications
- `GET /api/users/medications` - Get user medications (requires auth)
- `POST /api/users/medications` - Add user medication (requires auth)
- `PUT /api/users/medications/:id` - Update user medication (requires auth)
- `DELETE /api/users/medications/:id` - Delete user medication (requires auth)
- `PUT /api/users/medications/:id/taken` - Mark medication as taken (requires auth)
- `GET /api/users/dashboard` - Get dashboard data (requires auth)

### Health Check
- `GET /api/health` - Health check endpoint

## Database Schema

### Users
- Personal information (name, email, phone, etc.)
- Address and emergency contact
- Profile image
- Verification status

### Medications
- Product information (name, description, category)
- Pricing and stock
- Reviews and ratings
- Prescription requirements

### Orders
- User orders with items
- Delivery information
- Payment status
- Order tracking

### User Medications
- Personal medication tracking
- Dosing schedules
- Adherence tracking
- Refill reminders
