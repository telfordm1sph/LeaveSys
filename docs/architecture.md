# LeaveSys - Architecture Documentation

## Overview

LeaveSys is a web-based Leave Management System built with Laravel 12 (PHP 8.2+) and React 18.2, using Inertia.js for server-side rendering. The system handles employee leave balances, leave filings, approvals, accruals, and year-end processing.

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend Framework | Laravel | 12.0 |
| PHP Version | PHP | 8.2+ |
| Frontend Library | React | 18.2.0 |
| Build Tool | Vite | 6.2.4 |
| SSR Adapter | Inertia.js (Laravel) | 2.0 |
| CSS Framework | Tailwind CSS | 3.2.1 |
| UI Components | shadcn/ui (Radix UI) | - |
| UI Plugin | DaisyUI | 5.0.43 |
| State Management | Zustand | 5.0.6 |
| Forms | React Hook Form | 7.71.2 |
| Charts | Chart.js / react-chartjs-2 | 4.5.0 / 5.3.0 |
| Date Handling | date-fns, react-day-picker | 4.1.0 / 9.14.0 |
| Icons | Lucide React | - |
| Database | MySQL | - |
| Authentication | Custom SSO via Authify | - |

---

## Project Structure

```
LeaveSys/
├── app/
│   ├── Console/                    # Artisan commands
│   ├── Http/
│   │   ├── Controllers/           # Request handlers
│   │   │   ├── Admin/            # Admin controllers
│   │   │   ├── General/          # General controllers
│   │   │   └── Leave/            # Leave controllers
│   │   └── Middleware/           # Auth, Admin middleware
│   ├── Models/                    # Eloquent models
│   ├── Providers/                # Service providers
│   ├── Repositories/             # Data access layer
│   └── Services/                 # Business logic
│       └── Admin/                # Admin-specific services
├── bootstrap/                     # Laravel bootstrap
├── config/                        # Configuration files
├── database/
│   ├── migrations/               # Database migrations
│   └── seeders/                  # Seed data
├── resources/
│   ├── js/
│   │   ├── Components/           # React components
│   │   ├── Layouts/              # Page layouts
│   │   └── Pages/                # Inertia pages
│   └── views/                    # Blade templates
├── routes/                        # Route definitions
├── storage/                       # Logs, cache, uploads
├── package.json                   # Node dependencies
├── composer.json                  # PHP dependencies
├── vite.config.js                 # Vite config
├── tailwind.config.js             # Tailwind config
└── .env                          # Environment config
```

---

## Database Connections

| Connection Name | Database | Purpose |
|---------------|----------|---------|
| `mysql` | `leave` | Main application data |
| `masterlist` | `masterlist` | Employee master list |
| `authify` | `authify` | Authentication/Sessions |

---

## Key Components

### Controllers

| Controller | Responsibility |
|------------|----------------|
| `AuthenticationController` | Logout handling |
| `DashboardController` | Dashboard routes |
| `Leave/LeaveController` | Leave balances |
| `Leave/LeaveFilingController` | File new leave |
| `Leave/LeaveRequestController` | Leave requests/appeals |
| `General/ProfileController` | User profile |
| `General/AdminController` | Admin page |
| `Admin/LeavePolicyController` | Manage policies |
| `Admin/HolidayController` | Manage holidays |
| `Admin/VlAccrualTierController` | VL accrual tiers |
| `Admin/YearEndConfigController` | Year-end config |
| `Admin/EmployeeBalanceController` | Employee balances |

### Services

| Service | Responsibility |
|--------|----------------|
| `LeaveBalanceService` | Leave balance calculations |
| `LeaveFilingService` | Leave filing logic |
| `LeaveApprovalService` | Approval workflow |
| `YearEndService` | Year-end processing |
| `LeaveAccrualService` | Accrual computations |

### Repositories

| Repository | Responsibility |
|-----------|----------------|
| `LeaveBalanceRepository` | Balance data access |
| `LeaveRequestRepository` | Request data access |
| `LeavePolicyRepository` | Policy data access |

---

## Core Features

### 1. Leave Management
- File leave applications (VL, SL, BL, EL, etc.)
- View leave balances
- Cancel leave requests
- Upload leave attachments

### 2. Approval Workflow
- Multi-level approver chain
- Configurable approvers per leave type
- Appeal support for denied requests

### 3. Leave Policies
- Define rules per leave type
- Set accrual rates
- Configure carry-over rules
- Working day calculations

### 4. Accrual System
- Automatic VL step-up based on tenure tiers
- Monthly/annual accrual schedules
- Accrual audit logging

### 5. Year-End Processing
- Balance carry-over
- Leave type conversions
- Configurable conversion rules

### 6. Holiday Management
- Define holidays per year
- Automatic working day calculations

### 7. Dashboard & Reporting
- Leave balance summary
- Pending requests
- Charts for leave statistics

---

## API Routes

Routes are defined in:
- `routes/web.php` - Main router (imports other route files)
- `routes/auth.php` - Authentication routes
- `routes/general.php` - General user routes
- `routes/admin.php` - Admin routes
- `routes/leave.php` - Leave management routes

---

## Authentication

- **Method:** Custom SSO via Authify service
- **Session Management:** MySQL-based sessions via `authify` database
- **Middleware:**
  - `authify` - User authentication check
  - `isAdmin` - Admin privilege check

---

## Frontend Architecture

### Entry Point
- `resources/js/app.jsx` - React entry using `createInertiaApp()`

### State Management
- **Zustand** for global application state
- Stores in `resources/js/store/`

### Key Components
- `resources/js/Components/` - Reusable UI components
- `resources/js/Layouts/` - Page layouts (AuthenticatedLayout, etc.)
- `resources/js/Pages/` - Route-specific page components

### Frontend Stack
- React 18.2
- shadcn/ui (Radix UI primitives)
- Tailwind CSS 3.2.1 + DaisyUI
- React Hook Form for form handling
- Chart.js for visualizations

---

## Configuration Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables (DB connections, App key, etc.) |
| `config/database.php` | Database connection settings |
| `config/app.php` | Application settings |
| `vite.config.js` | Vite build configuration |
| `tailwind.config.js` | Tailwind CSS configuration |
| `package.json` | Node dependencies |
| `composer.json` | PHP dependencies |

---

## Key Service Flows

### Leave Filing Flow
1. User fills leave form
2. `LeaveFilingService` validates request
3. Deduction calculated (working days)
4. `LeaveRequestRepository` creates record
5. Notification sent to approver

### Approval Flow
1. Approver views pending requests
2. Approve/Deny action
3. `LeaveApprovalService` processes action
4. Balance deducted on approval
5. `LeaveAccrualLog` records change

### Year-End Flow
1. Admin triggers year-end process
2. `YearEndService` processes configured rules
3. Balances carried over/converted
4. `YearEndConversionLog` records outcomes

---

## Dependencies Summary

### Production (Node)
- react, react-dom
- @inertiajs/react, @inertiajs/server
- @radix-ui/* (dialog, dropdown, select, etc.)
- shadcn/ui components
- zustand
- react-hook-form
- chart.js, react-chartjs-2
- date-fns, react-day-picker
- lucide-react, sonner

### Development (Node)
- vite
- tailwindcss, postcss, autoprefixer
- @vitejs/plugin-react

### PHP (Composer)
- laravel/framework: ^12.0
- inertiajs/inertia-laravel
- doctrine/dbal

---

*Last Updated: April 2026*