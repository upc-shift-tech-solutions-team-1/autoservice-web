# AutoService - Workshop Management Platform

## Introduction

AutoService is a modern web platform focused on optimizing the administration and daily operations of automotive workshops and vehicle service centers. The application centralizes customer management, vehicle records, work orders, mechanics coordination, and workshop processes in a single environment, improving operational efficiency and service quality.

The platform was developed as part of a university software engineering project and follows a modular architecture based on Domain-Driven Design (DDD) principles.

---

# Key Features

* **Customer Management:** Register, update, and manage customer information and service history.
* **Vehicle Administration:** Store and organize vehicle records linked to customers.
* **Workshop Operations:** Manage work orders, repair tasks, and workshop activities.
* **Mechanic Coordination:** Assign mechanics and monitor responsibilities.
* **Fleet Management:** Organize workshop vehicles and operational resources.
* **Authentication Module:** Secure access and user session management.
* **Internationalization (i18n):** Multi-language support for a more accessible user experience.
* **Dashboard and Data Visualization:** Display operational data using charts and analytics.
* **Reusable UI Components:** Modular and scalable component-based frontend architecture.

---

# Architecture

This project follows a modular architecture inspired by **Domain-Driven Design (DDD)** and layered organization. Each domain represents a specific business area and contains its own application logic, domain models, infrastructure services, and presentation layer.

## Domain Structure

The system is divided into several domains:

* **Auth:** User authentication and access control.
* **Customer Management:** Customer and vehicle relationship administration.
* **Customer Trust:** Customer service and trust-related functionalities.
* **Fleet Management:** Vehicle and fleet administration.
* **Mechanic:** Mechanic-related features and interactions.
* **Staff Coordination:** Employee coordination and assignment management.
* **Workshop Operations:** Work orders, maintenance tasks, and workshop workflows.

---

# Layered Architecture

Each domain follows a layered structure similar to the following:

```text
bounded-context/
├── application/       # Business logic orchestration
├── domain/            # Entities and business rules
├── infrastructure/    # APIs, services, and external integrations
└── presentation/      # Views, pages, and UI components
```

---

## 1. Application Layer (`application/`)

The application layer coordinates business workflows and manages application state.

### Responsibilities

* Handles business use cases
* Coordinates communication between layers
* Centralizes state management logic
* Processes user actions and workflows

### Examples

```text
customer-management/application/
fleet-management/application/
workshop-operations/application/
```

---

## 2. Domain Layer (`domain/`)

The domain layer contains the core business entities and rules of the application.

### Responsibilities

* Defines business entities
* Encapsulates domain logic
* Represents real-world workshop concepts

### Examples

```text
vehicle.entity.js
customer.entity.js
work-order.entity.js
```

---

## 3. Infrastructure Layer (`infrastructure/`)

The infrastructure layer manages communication with APIs, external services, and data transformation.

### Responsibilities

* HTTP requests using Axios
* API integrations
* Resource mapping and data transformation
* External service communication

### Examples

```text
customer-card.vue
vehicle-table.vue
work-order-dialog.vue
```

---

## 4. Presentation Layer (`presentation/`)

The presentation layer contains all user interface elements and pages.

### Structure

```text
presentation/
├── components/     # Reusable UI components
├── pages/          # Main application pages
└── dialogs/        # Modal components (optional)
```

### Responsibilities

* Displays UI components
* Handles user interaction
* Organizes pages and visual workflows
* Connects frontend views with application logic

### Examples

```text
customer-card.vue
vehicle-table.vue
work-order-dialog.vue
```

---

# Project Structure

```text
src/
├── domains/
│   ├── auth/
│   ├── customer-management/
│   ├── customer-trust/
│   ├── fleet-management/
│   ├── mechanic/
│   ├── staff-coordination/
│   └── workshop-operations/
├── locales/                 # Translation files
├── router/                  # Application routes
├── shared/                  # Shared utilities and components
├── i18n.js                  # Internationalization configuration
├── App.vue
└── main.js
```

---

# Naming Conventions

| Element               | Convention         | Example              |
| --------------------- | ------------------ | -------------------- |
| Vue Components        | kebab-case         | `customer-card.vue`  |
| Variables & Functions | camelCase          | `getCustomerData()`  |
| Domain Entities       | `{name}.entity.js` | `vehicle.entity.js`  |
| API Services          | `{domain}-api.js`  | `fleet-api.js`       |
| Pages                 | kebab-case         | `dashboard-page.vue` |

---

# Technologies

The project was developed using modern frontend technologies:

* **Vue 3** — Progressive JavaScript framework
* **Vite** — Fast frontend tooling and development server
* **Pinia** — State management solution for Vue
* **Vue Router** — Client-side routing system
* **PrimeVue** — UI component framework
* **Axios** — HTTP client for API requests
* **Chart.js** — Data visualization and charts
* **Vue I18n** — Internationalization support

---

# Getting Started

## Prerequisites

Before running the project, make sure you have installed:

* Node.js (v18 or higher)
* npm

---

## Installation

Clone the repository and install dependencies:

```bash
npm install
```

---

## Development Server

Run the project locally:

```bash
npm run dev
```

---

## Production Build

Generate the optimized production build:

```bash
npm run build
```

---

# Internationalization Support

The project includes multilingual support using Vue I18n.

Translation files are located inside:

```text
src/locales/
```

The internationalization configuration is managed in:

```text
src/i18n.js
```

---

# Design Principles

The project follows these development principles:

* **Separation of Concerns:** Each layer has clearly defined responsibilities.
* **Scalability:** Modular domains simplify future expansion.
* **Maintainability:** Organized structure improves readability and maintenance.
* **Reusability:** Shared components and services reduce duplicated code.
* **Consistency:** Unified naming conventions and project organization.

---

# License

This project was developed for academic and educational purposes as part of a university software engineering project.