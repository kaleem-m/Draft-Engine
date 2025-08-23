# Live Fantasy Draft Engine

A modern, real-time fantasy draft application built with HTML, CSS, JavaScript, and Firebase. Create and manage live fantasy drafts with your friends, featuring real-time synchronization, customizable roster settings, and a beautiful responsive interface.

## 🎯 Project Overview

This Fantasy Draft Engine provides a complete solution for running live fantasy sports drafts online. Similar to platforms like Sleeper or FantasyPros, it offers real-time draft boards, automatic pick timers, and seamless multi-user synchronization.

## ✨ Currently Completed Features

### Core Functionality
- **User Authentication** 
  - Email/password registration and login
  - Google Sign-In integration
  - Persistent user sessions
  - User profile management

- **Draft Creation & Configuration**
  - Customizable team count (2-20 teams)
  - Adjustable pick timer (10-300 seconds)
  - Flexible roster position configuration
  - Custom position names (works for any sport)
  - Unique shareable draft codes

- **Live Draft Board**
  - Real-time synchronization via Firebase
  - Snake draft format
  - Automatic timer with warnings
  - Visual on-the-clock indicators
  - Player search and filtering
  - Position-based filtering
  - Drafted player tracking

- **Draft Management**
  - Pause/resume functionality (admin only)
  - Undo last pick capability
  - Reset entire draft option
  - Auto-skip on timer expiration
  - Join as participant or spectator

- **Export Options**
  - CSV export of draft results
  - Downloadable draft summary

### UI/UX Features
- **Dark Mode** - Toggle between light and dark themes
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Sound Notifications** - Audio alerts for turns and warnings
- **Smooth Animations** - Polished transitions and effects
- **Glassmorphism Design** - Modern, beautiful interface
- **Toast Notifications** - Non-intrusive status updates
- **Keyboard Shortcuts** - Quick navigation (Ctrl+K for search, Alt+D for dark mode)

## 🔗 Entry Points & URLs

### Main Application
- `/index.html` - Main entry point for the application

### Application Screens
- **Authentication Screen** - Login/Register interface
- **Dashboard** - Create new drafts or join existing ones
- **Draft Setup** - Configure draft settings
- **Draft Board** - Live draft interface with real-time updates

### API Endpoints (Future Implementation)
The application is designed to work with Firebase Realtime Database. No custom API endpoints are required.

## 🚧 Features Not Yet Implemented

1. **Player Statistics Integration**
   - Connect to sports data APIs (ESPN, Yahoo, etc.)
   - Display real-time player stats and projections
   - Season performance tracking

2. **Advanced Draft Formats**
   - Auction draft support
   - Keeper league functionality
   - Dynasty league features

3. **Custom Team Logos**
   - Upload and display team images
   - Team customization options

4. **Draft History**
   - Complete draft archives
   - Historical performance tracking
   - Draft replay functionality

5. **Mobile Apps**
   - Native iOS application
   - Native Android application

6. **Advanced Export Options**
   - PNG/Image export of draft board
   - PDF draft reports
   - Excel format exports

## 🛠️ Technical Setup

### Prerequisites
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password and Google Sign-In)
3. Enable Realtime Database
4. Get your Firebase configuration

### Installation
1. Clone or download this project
2. Open `js/config.js`
3. Replace the Firebase configuration placeholders with your actual config:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Firebase Database Rules
Set up your Realtime Database rules:
```json
{
  "rules": {
    "drafts": {
      ".read": "auth != null",
      "$draftId": {
        ".write": "auth != null"
      }
    },
    "users": {
      "$userId": {
        ".read": "$userId === auth.uid",
        ".write": "$userId === auth.uid"
      }
    }
  }
}
```

## 📁 Project Structure

```
/
├── index.html              # Main application HTML
├── css/
│   └── style.css          # Custom styles and animations
├── js/
│   ├── config.js          # Firebase config and app settings
│   ├── auth.js            # Authentication module
│   ├── draft.js           # Draft management module
│   └── main.js            # Main application logic
└── README.md              # Project documentation
```

## 🎯 Recommended Next Steps

1. **Deploy to Production**
   - Use the Publish tab to deploy your application
   - Configure custom domain if desired
   - Set up SSL certificates

2. **Integrate Player Data API**
   - Connect to sports data providers
   - Implement player search autocomplete
   - Add real-time stats display

3. **Enhance Draft Features**
   - Add trade functionality
   - Implement keeper selections
   - Create mock draft mode

4. **Improve Analytics**
   - Add draft grade calculations
   - Implement pick value charts
   - Create post-draft reports

5. **Social Features**
   - Add chat functionality
   - Create league message boards
   - Implement trash talk features

6. **Performance Optimization**
   - Implement lazy loading for player lists
   - Add service worker for offline support
   - Optimize Firebase queries

## 🔧 Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **CSS Framework**: Tailwind CSS (via CDN)
- **Icons**: Font Awesome
- **Backend**: Firebase (Authentication, Realtime Database)
- **Design**: Glassmorphism, Dark Mode, Responsive Design

## 📝 Data Models

### User Model
```javascript
{
  uid: "string",
  email: "string",
  displayName: "string",
  photoURL: "string",
  createdAt: "timestamp",
  drafts: {
    draftId: true
  }
}
```

### Draft Model
```javascript
{
  code: "string",
  name: "string",
  createdBy: "userId",
  createdAt: "timestamp",
  teams: "number",
  timePerPick: "number",
  rosterSettings: [
    { name: "string", count: "number" }
  ],
  status: "waiting|active|paused|completed",
  participants: {},
  picks: {},
  teamRosters: {}
}
```

## 🚀 Publishing

To deploy this application:
1. Ensure Firebase is properly configured
2. Test all features locally
3. Use the **Publish tab** to deploy your website
4. Share the draft engine URL with your league

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

This is a demonstration project. Feel free to fork and customize for your own fantasy leagues!

## 📄 License

This project is provided as-is for educational and personal use.

---

**Note**: This is a fully functional draft engine ready for use. Just add your Firebase configuration and you're ready to start drafting!