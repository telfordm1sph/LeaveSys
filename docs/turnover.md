# LeaveSys - Turnover Documentation

## Overview for New Developers

Welcome to LeaveSys. This document provides essential information for developers taking over this project.

---

## Getting Started

### Prerequisites

- PHP 8.2+
- Node.js 18+
- MySQL 8.0+
- Composer
- Git

### Initial Setup

1. **Clone the repository**
2. **Install PHP dependencies**
    ```bash
    composer install
    ```
3. **Install Node dependencies**
    ```bash
    npm install
    ```
4. **Configure environment**

    ```bash
    cp .env.example .env
    ```

    Edit `.env` with your database credentials.

5. **Generate application key**
    ```bash
    php artisan key:generate
    ```
6. **Run migrations**
    ```bash
    php artisan migrate
    ```
7. **Start development servers**
    ```bash
    # Backend
    php artisan serve
    # Frontend (Hot reload)
    npm run dev
    ```

---

## Database Connections

The application uses **three** MySQL connections:

| Connection   | Database     | Purpose            |
| ------------ | ------------ | ------------------ |
| `mysql`      | `leave`      | Main leave data    |
| `masterlist` | `masterlist` | Employee records   |
| `authify`    | `authify`    | SSO Authentication |

**Important:** All three databases must exist and be accessible. Configure in `.env`:

```
DB_CONNECTION=mysql
DB_HOST=...
DB_PORT=...
DB_DATABASE=leave
DB_USERNAME=...
DB_PASSWORD=...

DB_CONNECTION_MASTERLIST=mysql
DB_HOST_MASTERLIST=...
DB_PORT_MASTERLIST=...
DB_DATABASE_MASTERLIST=masterlist
DB_USERNAME_MASTERLIST=...
DB_PASSWORD_MASTERLIST=...

DB_CONNECTION_AUTHIFY=mysql
DB_HOST_AUTHIFY=...
DB_PORT_AUTHIFY=...
DB_DATABASE_AUTHIFY=authify
DB_USERNAME_AUTHIFY=...
DB_PASSWORD_AUTHIFY=...
```

---

## Authentication

- Uses **custom SSO via Authify** service
- **DO NOT modify** Authify integration without coordinating with IT security
- Sessions stored in `authify` database
- Custom middleware: `AuthenticateSession` and `IsAdmin`

---

## Common Development Tasks

### Creating a New Leave Type

1. Add entry to `leave_policy` table via migration or seeder
2. Configure in `Admin/LeavePolicyController`
3. Add form options in frontend (`LeaveFilingController`)

### Modifying Leave Balance Calculation

- File: `app/Services/LeaveBalanceService.php`
- Also check `app/Repositories/LeaveBalanceRepository.php`

### Adding a New Report/Dashboard Widget

- Frontend: `resources/js/Pages/Dashboard.jsx`
- Backend: `app/Http/Controllers/DashboardController.php`

### Changing Approval Workflow

- File: `app/Services/LeaveApprovalService.php`
- Table: `leave_approvers`

### Year-End Processing Configuration

- File: `app/Services/YearEndService.php`
- Config table: `year_end_config`

---

## Key Files Reference

### Backend

| File                     | Purpose           |
| ------------------------ | ----------------- |
| `routes/web.php`         | Main router       |
| `app/Http/Controllers/*` | Request handlers  |
| `app/Models/*`           | Database models   |
| `app/Services/*`         | Business logic    |
| `app/Repositories/*`     | Data access layer |
| `database/migrations/*`  | Schema changes    |

### Frontend

| File                        | Purpose             |
| --------------------------- | ------------------- |
| `resources/js/app.jsx`      | React entry point   |
| `resources/js/Pages/*`      | Page components     |
| `resources/js/Components/*` | Reusable components |
| `resources/js/store/*`      | Zustand stores      |

### Configuration

| File                  | Purpose               |
| --------------------- | --------------------- |
| `.env`                | Environment variables |
| `config/database.php` | DB connections        |
| `vite.config.js`      | Build config          |
| `tailwind.config.js`  | CSS config            |

---

## Important Business Rules

1. **Leave balances stored in minutes** (not days)
2. **Working days** calculated excluding weekends and holidays
3. **VL accrual** uses tier-based step-up system (`vl_accrual_tier` table)
4. **Year-end** must run sequentially - do not run multiple times
5. **Leave approvals** are final; appeals go through separate workflow

---

## Testing

Run tests:

```bash
# PHP tests
php artisan test

# Frontend lint
npm run lint

# Type check (if configured)
npm run typecheck
```

---

## Troubleshooting

### Common Issues

| Issue                     | Solution                                              |
| ------------------------- | ----------------------------------------------------- |
| "Database not found"      | Create all 3 databases (leave, masterlist, authify)   |
| "Session expired"         | Check Authify database connection                     |
| "Leave balance incorrect" | Check accrual log in `leave_accrual_log` table        |
| "Working days wrong"      | Verify holidays in `holidays` table                   |
| "Year-end failed          | Check `year_end_config` and `year_end_conversion_log` |

### Logs

Check these locations for errors:

- `storage/logs/laravel.log` - Application logs
- `storage/logs/` - Additional Laravel logs

---

## Frontend Development

### Adding a New Page

1. Create component in `resources/js/Pages/`
2. Add route in `routes/*.php`
3. Register in controller

### Using shadcn/ui Components

```jsx
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";

function MyComponent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Title</CardTitle>
            </CardHeader>
            <CardContent>
                <Input placeholder="Enter value" />
                <Button>Submit</Button>
            </CardContent>
        </Card>
    );
}
```

### Available shadcn/ui Components

- `button`, `input`, `textarea`, `label`
- `card`, `badge`, `alert`, `progress`
- `dialog`, `popover`, `select`, `combobox`, `dropdown-menu`
- `tabs`, `calendar`, `date-picker`
- `tooltip`, `separator`
- `avatar`, `sonner` (toast notifications)
- `command`

### State Management (Zustand)

```jsx
import { create } from "zustand";

const useStore = create((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

---

## Build for Production

```bash
# Build frontend assets
npm run build

# Optimize Laravel
php artisan optimize
```

---

## Contact Information

- **Original Developer:** Jester Ryan B. Tañada
- **Documentation:** See `docs/architecture.md`

---

## Security Notes

- Never commit `.env` files with actual credentials
- Use strong APP_KEY in production
- Keep dependencies updated
- Follow Laravel security best practices

---

_Last Updated: April 2026_
