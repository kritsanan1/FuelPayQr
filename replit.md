# GasPay QR - Thai Fuel Station Payment System

## Overview

This is a full-stack web application for managing QR code-based payments at Thai fuel stations. The system allows employees to generate Thai banking QR codes (PromptPay, Bangkok Bank, SCB, Kasikornbank) for fuel transactions and monitor payment status in real-time.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Comprehensive Banking Integration & Real Data Implementation (July 22, 2025)
- **Real PromptPay Integration**: Implemented EMV QR Code standard with authentic Thai banking protocols
- **Multi-Bank QR Support**: Added Bangkok Bank (BBL), SCB, Kasikornbank with bank-specific deep links and branding
- **Real-Time Payment Monitoring**: WebSocket-based live payment tracking with instant status updates
- **Enhanced QR Generator**: Fuel calculator, automatic amount calculation, pump assignment, and bank status indicators
- **Authentic Banking APIs**: Real-time bank status checking, service health monitoring, and API response validation
- **Advanced UX/UI**: Interactive fuel type selection, Thai bank color schemes, progress indicators, and mobile-optimized interface
- **Data Integrity**: All QR codes use authentic Thai banking standards, real transaction IDs, and proper merchant codes
- **Character-Driven Onboarding**: Working tutorial system with Niran, Malee, and Somchai providing interactive guidance

### Migration to Replit Environment (July 22, 2025)
- Successfully migrated from Replit Agent to standard Replit environment
- Implemented fallback memory storage system for development when DATABASE_URL is not available
- Modified authentication system to support both PostgreSQL and memory-based session storage
- Added graceful database connection handling with fallback mechanisms
- All core functionality preserved: Thai banking QR generation, payment monitoring, fraud detection
- System now runs cleanly in Replit with proper security practices and client/server separation

## System Architecture

The application follows a full-stack TypeScript architecture with a clear separation between client and server:

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for development and building
- **Styling**: Tailwind CSS with custom Thai banking theme colors (Petrol Blue #367FA9, Fire Engine Red #D14906)
- **UI Components**: Radix UI primitives with shadcn/ui components for consistent design
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect (OIDC)
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple

## Key Components

### Database Schema
The system uses PostgreSQL with the following core tables:
- `users` - User profiles from Replit Auth
- `employees` - Employee management with station assignments
- `stations` - Gas station information
- `transactions` - Fuel purchase transactions
- `qr_payments` - QR code payment records
- `bank_providers` - Supported Thai banks (PromptPay, BBL, SCB, Kasikorn)
- `fraud_alerts` - Security monitoring and fraud detection

### Services Layer
- **QRGenerator**: Creates Thai banking QR codes with proper formatting for different banks
- **BankingService**: Monitors Thai bank API status and handles multi-bank integration
- **FraudDetection**: Analyzes transaction patterns for suspicious activity

### Authentication & Authorization
- Uses Replit's built-in OIDC authentication
- Role-based access control (employee, manager, admin)
- Session-based authentication with PostgreSQL storage
- Automatic redirect handling for unauthenticated users

### UI/UX Features
- Bilingual support (English/Thai) with i18n system
- Responsive design optimized for mobile and tablet use
- Real-time payment monitoring with auto-updates
- Thai banking integration with proper bank branding
- Fraud alert system with modal notifications

## Data Flow

1. **Employee Login**: Replit Auth → User profile creation/update → Employee role assignment
2. **QR Generation**: Form input → Transaction creation → QR code generation → Bank API integration
3. **Payment Monitoring**: Webhook/polling → Payment status updates → Real-time UI updates
4. **Fraud Detection**: Transaction analysis → Pattern matching → Alert generation

## External Dependencies

### Banking Integration
- Thai PromptPay API for universal QR payments
- Bangkok Bank API Portal integration
- SCB Open API for Siam Commercial Bank
- Kasikornbank K API integration

### Development Tools
- Neon Database for PostgreSQL hosting
- Drizzle Kit for database migrations
- Vite for frontend development and building
- Replit development environment with hot reload

### UI Libraries
- Radix UI for accessible component primitives
- Tailwind CSS for utility-first styling
- Lucide React for consistent iconography
- QRCode library for QR generation

## Deployment Strategy

### Development
- Runs on Replit with hot module replacement
- Uses Vite dev server for frontend
- Express server with TypeScript compilation via tsx
- Database migrations with Drizzle Kit

### Production Build
- Frontend: Vite build output to `dist/public`
- Backend: ESBuild bundle to `dist/index.js`
- Single Node.js process serving both static files and API
- PostgreSQL database with connection pooling

### Environment Configuration
- `DATABASE_URL` - Neon PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `REPL_ID` - Replit environment identifier
- Banking API keys stored in database `bank_api_configs` table

The system is designed to be scalable and maintainable while focusing on the specific needs of Thai fuel stations with proper banking integration and security measures.