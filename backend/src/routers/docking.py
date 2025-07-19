"""
Molecular docking router
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from typing import List, Optional
import os
import uuid
import shutil
from datetime import datetime

from ..models.schemas import (
    DockingJobResponse, 
    DockingResult, 
    DockingStatus,
    ErrorResponse
)
from ..services.vina_service import vina_service
from ..core.config import settings

router = APIRouter()

# In-memory storage for job results (in production, use a database)
job_results = {}

@router.post("/docking/submit", response_model=DockingJobResponse)
async def submit_docking_job(
    background_tasks: BackgroundTasks,
    receptor: UploadFile = File(..., description="Receptor PDB/PDBQT file"),
    ligands: List[UploadFile] = File(..., description="Ligand files"),
    center_x: Optional[float] = Form(0.0),
    center_y: Optional[float] = Form(0.0),
    center_z: Optional[float] = Form(0.0),
    size_x: Optional[float] = Form(20.0),
    size_y: Optional[float] = Form(20.0),
    size_z: Optional[float] = Form(20.0),
    exhaustiveness: Optional[int] = Form(8),
    num_modes: Optional[int] = Form(9)
):
    """
    Submit a molecular docking job
    """
    # Validate file extensions
    def validate_file_extension(filename: str) -> bool:
        return any(filename.lower().endswith(f".{ext}") for ext in settings.ALLOWED_EXTENSIONS)
    
    if not validate_file_extension(receptor.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid receptor file format. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
    
    for ligand in ligands:
        if not validate_file_extension(ligand.filename):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid ligand file format: {ligand.filename}. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )
    
    # Generate unique job ID
    job_id = str(uuid.uuid4())
    
    # Create job directory
    job_dir = os.path.join(settings.UPLOAD_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)
    
    try:
        # Save receptor file
        receptor_path = os.path.join(job_dir, receptor.filename)
        with open(receptor_path, "wb") as buffer:
            shutil.copyfileobj(receptor.file, buffer)
        
        # Save ligand files
        ligand_paths = []
        for ligand in ligands:
            ligand_path = os.path.join(job_dir, ligand.filename)
            with open(ligand_path, "wb") as buffer:
                shutil.copyfileobj(ligand.file, buffer)
            ligand_paths.append(ligand_path)
        
        # Initialize job status
        job_results[job_id] = DockingResult(
            job_id=job_id,
            status=DockingStatus.PENDING,
            receptor_name=receptor.filename,
            ligand_results=[],
            total_ligands=len(ligands),
            successful_docks=0,
            failed_docks=0,
            created_at=datetime.now().isoformat()
        )
        
        # Prepare docking parameters
        docking_params = {
            "center_x": center_x,
            "center_y": center_y,
            "center_z": center_z,
            "size_x": size_x,
            "size_y": size_y,
            "size_z": size_z,
            "exhaustiveness": exhaustiveness,
            "num_modes": num_modes
        }
        
        # Add background task to process docking
        background_tasks.add_task(
            process_docking_background,
            job_id,
            receptor_path,
            ligand_paths,
            docking_params
        )
        
        return DockingJobResponse(
            job_id=job_id,
            status=DockingStatus.PENDING,
            message="Docking job submitted successfully. Use the job ID to check status."
        )
        
    except Exception as e:
        # Clean up on error
        if os.path.exists(job_dir):
            shutil.rmtree(job_dir)
        raise HTTPException(status_code=500, detail=f"Failed to submit job: {str(e)}")

@router.get("/docking/status/{job_id}", response_model=DockingResult)
async def get_docking_status(job_id: str):
    """
    Get the status and results of a docking job
    """
    if job_id not in job_results:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job_results[job_id]

@router.get("/docking/results/{job_id}")
async def download_results(job_id: str):
    """
    Download docking results as a zip file
    """
    if job_id not in job_results:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job_result = job_results[job_id]
    if job_result.status != DockingStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Job not completed yet")
    
    # Create results zip file (simplified - in production, implement proper zip creation)
    results_dir = os.path.join(settings.RESULTS_DIR, job_id)
    if not os.path.exists(results_dir):
        raise HTTPException(status_code=404, detail="Results not found")
    
    # Return first result file for now (in production, create proper zip)
    if job_result.ligand_results:
        first_result = job_result.ligand_results[0]
        if first_result.pose_file and os.path.exists(first_result.pose_file):
            return FileResponse(
                first_result.pose_file,
                filename=f"{job_id}_results.pdbqt",
                media_type="application/octet-stream"
            )
    
    raise HTTPException(status_code=404, detail="No result files found")

@router.delete("/docking/job/{job_id}")
async def delete_job(job_id: str):
    """
    Delete a docking job and its associated files
    """
    if job_id not in job_results:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Remove job from memory
    del job_results[job_id]
    
    # Clean up files
    job_dir = os.path.join(settings.UPLOAD_DIR, job_id)
    if os.path.exists(job_dir):
        shutil.rmtree(job_dir)
    
    results_dir = os.path.join(settings.RESULTS_DIR, job_id)
    if os.path.exists(results_dir):
        shutil.rmtree(results_dir)
    
    return {"message": "Job deleted successfully"}

async def process_docking_background(
    job_id: str,
    receptor_path: str,
    ligand_paths: List[str],
    docking_params: dict
):
    """
    Background task to process docking job
    """
    try:
        # Update status to processing
        if job_id in job_results:
            job_results[job_id].status = DockingStatus.PROCESSING
        
        # Process the docking job
        result = await vina_service.process_docking_job(
            job_id,
            receptor_path,
            ligand_paths,
            docking_params
        )
        
        # Update job results
        job_results[job_id] = result
        
    except Exception as e:
        # Update job with error status
        if job_id in job_results:
            job_results[job_id].status = DockingStatus.FAILED
            job_results[job_id].error_message = str(e)
            job_results[job_id].completed_at = datetime.now().isoformat()
