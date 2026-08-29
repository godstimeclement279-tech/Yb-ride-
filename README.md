# 🚕 YB Ride

## Ride-Hailing Mobile Application

**YB Ride** is a client-funded ride-hailing mobile application designed to simplify the process of requesting, paying for and managing rides.

The application is being developed with a focus on providing passengers with a simple booking experience while connecting the passenger workflow with driver assignment and trip management.

> **Project Status:** Active Development, Debugging & Testing  
> **Project Type:** Paid Client Project  
> **Primary Application:** Passenger Mobile App

---

## 📱 Project Overview

YB Ride is designed as a multi-role transportation platform consisting of passenger, driver and administrative workflows.

The **Passenger App** allows users to:

- Create an account
- Log in securely
- Select a vehicle type
- Select pickup and destination locations
- Calculate the ride fare
- Request a ride
- Complete payment
- Receive driver assignment
- Monitor driver ETA
- Follow ride status

The current repository focuses primarily on the **Passenger Mobile Application**.

---

## 🖼️ Application Preview

![YB Ride Passenger App - Home Screen](assets/yb-ride-home.png)

### Home / Map Screen

The passenger home screen provides a map-based interface showing the user's current location and provides access to the ride-booking workflow.

---

# ✨ Core Features

### 🔐 Authentication

- User registration
- User login
- Authenticated passenger experience

### 🚗 Ride Booking

- Vehicle type selection
- Pickup location
- Destination selection
- Fare calculation
- Ride request

### 💳 Payment

- Paystack payment integration
- Payment-aware booking workflow

### 📍 Maps & Location

- Google Maps integration
- Location detection
- Pickup and destination handling
- Driver location/ETA functionality

### 👨‍✈️ Driver Assignment

- Driver assignment after a ride request
- Passenger visibility of assigned driver
- Estimated driver arrival time

### 🕐 Trip Management

- Ride status management
- Passenger trip monitoring
- Trip progression through the ride lifecycle

---

# 🔄 Ride Booking Workflow

The main passenger workflow is designed around the following process:

```text
Create Account / Login
        ↓
Select Vehicle
        ↓
Select Pickup Location
        ↓
Select Destination
        ↓
Calculate Fare
        ↓
Request Ride
        ↓
Complete Payment
        ↓
Driver Assigned
        ↓
Monitor Driver ETA
        ↓
Track Trip Status
```

---

# 🏗️ High-Level Architecture

```text
                    YB RIDE
                       │
                       ▼
             ┌──────────────────┐
             │ Passenger App    │
             │  React Native    │
             └────────┬─────────┘
                      │
             ┌────────┴─────────┐
             ▼                  ▼
      ┌──────────────┐   ┌──────────────┐
      │   Firebase   │   │  External    │
      │   Backend    │   │  Services    │
      └──────┬───────┘   └──────┬───────┘
             │                  │
       ┌─────┴─────┐      ┌─────┴──────┐
       ▼           ▼      ▼            ▼
   Auth/Data   App Data  Paystack   Google Maps
```

### Main technologies

**Mobile Application**
- React Native
- Expo

**Backend**
- Firebase

**Payments**
- Paystack

**Maps & Location**
- Google Maps

**Programming**
- JavaScript

**Development**
- Git
- GitHub
- Claude Code
- AI-assisted development

---

# 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| React Native | Cross-platform mobile application |
| Expo | React Native development and build workflow |
| Firebase | Backend services, authentication and application data |
| Paystack | Payment processing |
| Google Maps | Maps and location functionality |
| JavaScript | Application development |
| Git | Version control |
| GitHub | Source code management |
| Claude Code | AI-assisted development |

---

# 🤖 AI-Assisted Development

YB Ride was developed using an AI-assisted software development workflow.

I use **Claude Code** as a development assistant to accelerate implementation, investigate technical problems and explore solutions.

AI-generated implementations are not treated as automatically correct. The development process includes:

- Breaking requirements into smaller components
- Reviewing generated code
- Integrating application services
- Testing implemented features
- Investigating errors
- Debugging broken functionality
- Making corrections
- Retesting affected workflows

This approach allows AI to accelerate development while keeping software review, testing and debugging as part of the development process.

---

# 🐛 Engineering & Debugging

During development, some application components began producing issues after different features were integrated.

The debugging process involves:

1. Reproducing the issue
2. Identifying the affected workflow
3. Reviewing the relevant implementation
4. Tracing the source of the problem
5. Applying and testing a fix
6. Retesting connected functionality
7. Performing regression checks

The application is currently undergoing continued debugging and testing as development progresses.

---

# 📊 Current Status

### Passenger Application

- [x] Registration
- [x] Login
- [x] Vehicle selection
- [x] Pickup and destination
- [x] Fare calculation
- [x] Ride booking
- [x] Paystack integration
- [x] Driver assignment
- [x] Google Maps integration
- [x] Driver ETA
- [x] Trip status

### Current Development

- [ ] Final debugging
- [ ] Additional testing
- [ ] Further reliability improvements

The wider YB Ride platform is designed to include additional driver and administrative workflows.

---

# 💡 Project Objective

The objective of YB Ride is to provide a convenient digital ride-booking experience while creating a foundation for efficient transportation operations.

The system is designed around real business workflows rather than being only a UI prototype.

---

# 🚀 Future Development

Planned areas of development include:

- Expanded driver application functionality
- Staff and administrative management
- Improved real-time trip management
- Additional operational tools
- Notifications
- Analytics and reporting
- Further reliability and performance improvements

---

# 👨‍💻 Developer

## Ogwu Godstime Chinnazaekpere

**Software Developer**

Focused on building practical software products using modern development tools, AI-assisted coding workflows, APIs, backend services and automation.

### Areas of Experience

- React Native
- Firebase
- API Integration
- Payment Integration
- Google Maps
- AI-assisted software development
- OpenAI API
- OpenRouter
- AI Agents
- Automation tools
- Git & GitHub

**GitHub:** godstimeclement279-tech

---

## 📌 Project Status

**YB Ride is an active paid client project currently undergoing development, debugging and testing.**
