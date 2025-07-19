# Molecular Docking Platform

A professional full-stack web application for molecular docking using AutoDock Vina. This application provides an intuitive interface for submitting docking jobs, monitoring progress, and analyzing results.

## 🚀 Features

- **Modern React Frontend**: Built with TypeScript, Material-UI, and professional UX design
- **FastAPI Backend**: High-performance Python backend with async support
- **AutoDock Vina Integration**: Professional molecular docking with configurable parameters
- **Real-time Job Monitoring**: Live status updates and progress tracking
- **Interactive Results**: Sortable tables, best result highlighting, and downloadable outputs
- **Professional Architecture**: Clean separation of concerns with proper project structure

## 🏗️ Project Structure

```
windsurf-project/
├── backend/
│   ├── src/
│   │   ├── core/
│   │   │   ├── config.py          # Application configuration
│   │   │   └── __init__.py
│   │   ├── models/
│   │   │   ├── schemas.py         # Pydantic models
│   │   │   └── __init__.py
│   │   ├── routers/
│   │   │   ├── docking.py         # Docking endpoints
│   │   │   ├── health.py          # Health check
│   │   │   └── __init__.py
│   │   ├── services/
│   │   │   ├── vina_service.py    # AutoDock Vina integration
│   │   │   └── __init__.py
│   │   ├── main.py                # FastAPI application
│   │   └── __init__.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/
│   │   │   ├── DockingUpload.tsx  # File upload and parameter configuration
│   │   │   ├── JobStatus.tsx      # Real-time job monitoring
│   │   │   └── Results.tsx        # Results visualization
│   │   ├── services/
│   │   │   └── api.ts             # API client
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript type definitions
│   │   ├── App.tsx                # Main application component
│   │   └── index.tsx              # Application entry point
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## 🛠️ Installation

### Prerequisites

- Node.js (v16 or higher)
- Python 3.8+
- AutoDock Vina
- AutoDockTools (prepare_receptor4.py, prepare_ligand4.py)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file (optional):
```env
ALLOWED_ORIGINS=["http://localhost:3000"]
VINA_EXECUTABLE=vina
MAX_FILE_SIZE=104857600
```

5. Start the backend server:
```bash
cd src
python main.py
```

The API will be available at `http://localhost:8000` with documentation at `http://localhost:8000/api/docs`.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`.

## 🔬 Usage

### 1. Submit Docking Job

- Upload a receptor file (PDB/PDBQT format)
- Upload one or more ligand files (PDB/PDBQT/SDF/MOL2 formats)
- Configure docking parameters:
  - Binding site center coordinates (X, Y, Z)
  - Search space dimensions
  - Exhaustiveness and number of modes
- Submit the job and receive a unique job ID

### 2. Monitor Progress

- Track job status in real-time
- View progress indicators and statistics
- Get detailed information about successful and failed docks

### 3. Analyze Results

- View sortable results table with binding affinities and RMSD values
- Identify the best docking result with highlighted metrics
- Download result files for further analysis
- Quality assessment with color-coded indicators

## 🧪 API Endpoints

### Health Check
- `GET /api/health` - Service health status

### Docking Operations
- `POST /api/docking/submit` - Submit new docking job
- `GET /api/docking/status/{job_id}` - Get job status and results
- `GET /api/docking/results/{job_id}` - Download result files
- `DELETE /api/docking/job/{job_id}` - Delete job and cleanup files

## 🎨 UI Features

- **Material Design**: Modern, professional interface using Material-UI
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Drag & Drop**: Intuitive file upload with drag-and-drop support
- **Real-time Updates**: Live job status monitoring with automatic refresh
- **Data Visualization**: Interactive tables with sorting and filtering
- **Progress Indicators**: Visual feedback for long-running operations

## 🔧 Configuration

### Docking Parameters

- **Binding Site Center**: X, Y, Z coordinates of the binding site
- **Search Space Size**: Dimensions of the search area in Angstroms
- **Exhaustiveness**: Search thoroughness (1-32, default: 8)
- **Number of Modes**: Binding poses to generate (1-20, default: 9)

### File Formats

**Supported Receptor Formats:**
- PDB (Protein Data Bank)
- PDBQT (AutoDock format)

**Supported Ligand Formats:**
- PDB (Protein Data Bank)
- PDBQT (AutoDock format)
- SDF (Structure Data File)
- MOL2 (Tripos format)

## 🚦 Development

### Backend Development

The backend uses FastAPI with a clean architecture:

- **Models**: Pydantic schemas for request/response validation
- **Services**: Business logic and AutoDock Vina integration
- **Routers**: API endpoints and HTTP handling
- **Core**: Configuration and shared utilities

### Frontend Development

The frontend is built with React and TypeScript:

- **Components**: Reusable UI components with Material-UI
- **Services**: API client with error handling
- **Types**: TypeScript definitions for type safety
- **State Management**: React hooks for local state

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions or issues, please open a GitHub issue or contact the development team.

---

**Built with ❤️ using React, FastAPI, and AutoDock Vina**
