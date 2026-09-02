# 🚗 Instant Mechanic — Live Vehicle Service Dashboard

A full-stack live vehicle service management dashboard built for the Instant Mechanic Full Stack Developer Intern task.

## 🌐 Live Demo

Frontend:  
https://instant-mechanic-frontend-nine.vercel.app

Backend API:  
https://instant-mechanic-backend-wdbx.onrender.com

## ✨ Features

### Dashboard Overview

- Total Bookings
- Today's Bookings
- Completed Bookings
- Pending Bookings
- Cancelled Bookings
- Total Revenue
- Active Mechanics
- New Customers

### Analytics

- Bookings over time
- Revenue over time
- Booking status distribution
- Service/category breakdown

### Recent Bookings

- Booking ID
- Customer
- Vehicle
- Service
- Mechanic
- Status
- Estimated Cost
- Date & Time
- Search
- Status filtering
- Sorting
- Pagination

### Mechanics

- Mechanic name
- Specialization
- Current status
- Jobs completed
- Current/last booking

### Real-Time Updates

The dashboard uses Socket.IO for live booking updates without requiring a full page refresh.

## 🛠️ Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Lucide React
- Socket.IO Client

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO

## 🏗️ Architecture

React + Vite Frontend  
↓  
REST API + Socket.IO  
↓  
Node.js + Express Backend  
↓  
MongoDB