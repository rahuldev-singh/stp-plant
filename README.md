# STP Operational Dashboard

A professional, real-time monitoring dashboard for Sewage Treatment Plants (STP), built with React, Tailwind CSS, and Recharts.

## Features

- **Real-time Monitoring**: Live tracking of 20+ critical process parameters (BOD, COD, TSS, pH, etc.).
- **Interactive Dashboards**: Drill-down from high-level KPIs to individual sensor analysis.
- **Historical Analysis**: View and export historical sensor data with custom date ranges.
- **Alert System**: session-based alert logging with quick inspection capabilities.
- **Responsive Design**: Optimized for all screen sizes with a collapsible sidebar and fluid grid layouts.
- **Supabase Integration**: Ready for backend integration, with robust mock data fallback for local development.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm or yarn

### Installation

1. Extract the ZIP file to your local machine.
2. Open your terminal and navigate to the project directory.
3. Install the dependencies:
   ```bash
   npm install
   ```

### Running Locally

To start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

### Building for Production

To create a production-ready build:
```bash
npm run build
```
The output will be in the `dist/` directory.

## Configuration

The application uses environment variables for Supabase integration. Create a `.env` file in the root directory based on `.env.example`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_TABLE_NAME=sensor_data
```

If these variables are not provided, the application will automatically fall back to generating realistic mock data for all sensors.

## Technologies Used

- **React 19**: UI library
- **Vite**: Build tool and dev server
- **Tailwind CSS 4**: Styling
- **Recharts**: Data visualization
- **Lucide React**: Icon library
- **Motion**: Animations
- **Date-fns**: Date manipulation
