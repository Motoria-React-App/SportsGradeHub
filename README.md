# 🏆 SportsGradeHub

A modern web application for managing sports education, student evaluations, and exercise tracking. Built with React, TypeScript, and Vite.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat&logo=vercel)](https://sports-grade-hub.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)

## 🌐 Live Demo

Visit the live application: **[https://sports-grade-hub.vercel.app](https://sports-grade-hub.vercel.app)**

## ✨ Features

### 📊 Dashboard & Analytics
- **Interactive Dashboard** with real-time statistics
- **Weekly Schedule Management** for planning sports activities
- **Performance Radar Charts** for class analytics
- **Recent Activity Tracking** with quick actions panel

### 👥 Student Management
- Complete student database with personal information
- Student search and filtering capabilities
- Bulk operations (duplicate, export, delete)
- Individual student profiles with evaluation history
- Justification tracking with configurable limits

### 📚 Class Management
- Create and organize school classes by year
- Assign students to classes
- Link exercises to specific classes
- View class performance analytics
- Track student attendance and justifications

### 🏋️ Exercise Catalog
- Comprehensive exercise library
- Organize exercises into custom groups
- Link exercises to classes
- Track exercise completion and performance

### 📝 Evaluation System
- Grade students on various exercises
- Support for multiple grading systems
- Period-based evaluation tracking
- Export evaluations to Excel
- Visual grade indicators with color coding

### ⚙️ Settings & Customization
- **Grading System Configuration**: Customize grade scales and thresholds
- **Display Preferences**: Dark/Light theme support
- **Period Management**: Define evaluation periods and school year structure
- **Schedule Configuration**: Set up weekly class schedules
- **Data Management**: Import/Export functionality for backup and migration

### 🔍 Command Palette
- Quick search for students and classes
- Keyboard shortcuts for rapid navigation (Ctrl+K)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Motoria-React-App/SportsGradeHub.git
   cd SportsGradeHub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the backend connection**
   Copy `.env.example` to `.env` in this frontend directory. Set `VITE_API_URL`
   to your backend base URL and `VITE_API_KEY` to the same value as `SGH_API_KEY`
   on that backend. Restart Vite after changing these variables.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

### Buy Me a Coffee banner

The official yellow Buy Me a Coffee button links to
`https://buymeacoffee.com/aamritt` and appears above the account menu in the
desktop and mobile sidebar. Its embed lives in `src/components/coffee-banner.tsx`
inside an isolated iframe because the provider script uses `document.writeln`.

### Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework

### UI Components
- **shadcn/ui** - High-quality React components
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon set
- **Recharts** - Charting library for analytics

### Data & State Management
- **React Context API** - Global state management
- **Custom Providers** - Client, Settings, Schedule providers

### Additional Libraries
- **date-fns** - Date manipulation
- **XLSX** - Excel import/export
- **Sonner** - Toast notifications
- **clsx & tailwind-merge** - Conditional styling

## 📁 Project Structure

```
SportsGradeHub/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # Base UI components (shadcn/ui)
│   │   ├── login-form.tsx
│   │   ├── student-dialog.tsx
│   │   └── ...
│   ├── pages/           # Application pages
│   │   ├── Dashboard.tsx
│   │   ├── Students.tsx
│   │   ├── Classes.tsx
│   │   ├── Exercises.tsx
│   │   ├── Settings.tsx
│   │   └── ...
│   ├── provider/        # Context providers
│   │   ├── clientProvider.tsx
│   │   ├── settingsProvider.tsx
│   │   └── scheduleProvider.tsx
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript type definitions
│   ├── lib/             # Utility functions
│   ├── data/            # Static data and constants
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Application entry point
├── public/              # Static assets
├── index.html           # HTML entry point
└── package.json         # Dependencies and scripts
```

## 🔑 Key Components

### Pages
- **Dashboard** - Overview with statistics and quick actions
- **Students** - Student management and search
- **Classes** - Class organization and student assignment
- **Exercises** - Exercise catalog management
- **Valutazioni (Evaluations)** - Grade entry and tracking
- **Settings** - Application configuration
- **Welcome** - Onboarding and quick access

### Core Features
- Authentication system with login/signup
- Responsive design for mobile and desktop
- Theme switching (dark/light mode)
- Data export to Excel format
- Command palette for quick navigation

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is maintained by the Motoria React App organization.

## 👥 Organization

**Motoria-React-App** - [GitHub Organization](https://github.com/Motoria-React-App)

## 🐛 Bug Reports & Feature Requests

If you encounter any issues or have feature suggestions, please [open an issue](https://github.com/Motoria-React-App/SportsGradeHub/issues) on GitHub.

## 📞 Support

For questions or support, please reach out through:
- GitHub Issues
- Organization contact channels

---

**Made with ❤️ by the Motoria React App team
