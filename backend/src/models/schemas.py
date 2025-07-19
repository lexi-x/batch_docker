"""
Pydantic models for request/response schemas
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from enum import Enum

class FileType(str, Enum):
    """Supported file types"""
    PDB = "pdb"
    PDBQT = "pdbqt"
    SDF = "sdf"
    MOL2 = "mol2"

class DockingStatus(str, Enum):
    """Docking job status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class HealthResponse(BaseModel):
    """Health check response"""
    status: str = "healthy"
    timestamp: str
    version: str = "1.0.0"

class DockingRequest(BaseModel):
    """Docking job request"""
    receptor_filename: str
    ligand_filenames: List[str]
    center_x: Optional[float] = Field(default=0.0, description="X coordinate of binding site center")
    center_y: Optional[float] = Field(default=0.0, description="Y coordinate of binding site center")
    center_z: Optional[float] = Field(default=0.0, description="Z coordinate of binding site center")
    size_x: Optional[float] = Field(default=20.0, description="X dimension of search space")
    size_y: Optional[float] = Field(default=20.0, description="Y dimension of search space")
    size_z: Optional[float] = Field(default=20.0, description="Z dimension of search space")
    exhaustiveness: Optional[int] = Field(default=8, ge=1, le=32, description="Exhaustiveness of search")
    num_modes: Optional[int] = Field(default=9, ge=1, le=20, description="Number of binding modes to generate")

class LigandResult(BaseModel):
    """Individual ligand docking result"""
    ligand_name: str
    binding_affinity: float
    rmsd_lower_bound: float
    rmsd_upper_bound: float
    pose_file: Optional[str] = None

class DockingResult(BaseModel):
    """Complete docking job result"""
    job_id: str
    status: DockingStatus
    receptor_name: str
    ligand_results: List[LigandResult]
    total_ligands: int
    successful_docks: int
    failed_docks: int
    processing_time: Optional[float] = None
    error_message: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None

class DockingJobResponse(BaseModel):
    """Response for docking job submission"""
    job_id: str
    status: DockingStatus
    message: str

class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    detail: Optional[str] = None
    timestamp: str
