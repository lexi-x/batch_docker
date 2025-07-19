"""
AutoDock Vina service for molecular docking operations
"""
import subprocess
import os
import tempfile
import shutil
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime

from ..models.schemas import DockingResult, LigandResult, DockingStatus
from ..core.config import settings

logger = logging.getLogger(__name__)

class VinaService:
    """Service class for AutoDock Vina operations"""
    
    def __init__(self):
        self.temp_dir = settings.TEMP_DIR
        self.results_dir = settings.RESULTS_DIR
    
    def prepare_receptor(self, receptor_path: str, output_path: str) -> None:
        """
        Prepare receptor for docking using AutoDockTools
        
        Args:
            receptor_path: Path to input receptor file
            output_path: Path for output PDBQT file
        """
        try:
            command = [
                'prepare_receptor4.py',
                '-r', receptor_path,
                '-o', output_path
            ]
            result = subprocess.run(command, check=True, capture_output=True, text=True)
            logger.info(f"Receptor prepared successfully: {output_path}")
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to prepare receptor: {e.stderr}")
            raise Exception(f"Receptor preparation failed: {e.stderr}")
    
    def prepare_ligand(self, ligand_path: str, output_path: str) -> None:
        """
        Prepare ligand for docking using AutoDockTools
        
        Args:
            ligand_path: Path to input ligand file
            output_path: Path for output PDBQT file
        """
        try:
            command = [
                'prepare_ligand4.py',
                '-l', ligand_path,
                '-o', output_path
            ]
            result = subprocess.run(command, check=True, capture_output=True, text=True)
            logger.info(f"Ligand prepared successfully: {output_path}")
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to prepare ligand: {e.stderr}")
            raise Exception(f"Ligand preparation failed: {e.stderr}")
    
    def run_vina_docking(
        self,
        receptor_pdbqt: str,
        ligand_pdbqt: str,
        output_pdbqt: str,
        center_x: float = 0.0,
        center_y: float = 0.0,
        center_z: float = 0.0,
        size_x: float = 20.0,
        size_y: float = 20.0,
        size_z: float = 20.0,
        exhaustiveness: int = 8,
        num_modes: int = 9
    ) -> Dict[str, Any]:
        """
        Run AutoDock Vina docking
        
        Args:
            receptor_pdbqt: Path to prepared receptor PDBQT file
            ligand_pdbqt: Path to prepared ligand PDBQT file
            output_pdbqt: Path for output docked poses
            center_x, center_y, center_z: Binding site center coordinates
            size_x, size_y, size_z: Search space dimensions
            exhaustiveness: Search exhaustiveness
            num_modes: Number of binding modes to generate
            
        Returns:
            Dictionary containing docking results
        """
        try:
            command = [
                settings.VINA_EXECUTABLE,
                '--receptor', receptor_pdbqt,
                '--ligand', ligand_pdbqt,
                '--out', output_pdbqt,
                '--center_x', str(center_x),
                '--center_y', str(center_y),
                '--center_z', str(center_z),
                '--size_x', str(size_x),
                '--size_y', str(size_y),
                '--size_z', str(size_z),
                '--exhaustiveness', str(exhaustiveness),
                '--num_modes', str(num_modes)
            ]
            
            result = subprocess.run(command, check=True, capture_output=True, text=True)
            
            # Parse Vina output to extract binding affinities
            return self._parse_vina_output(result.stdout, output_pdbqt)
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Vina docking failed: {e.stderr}")
            raise Exception(f"Vina docking failed: {e.stderr}")
    
    def _parse_vina_output(self, vina_output: str, output_file: str) -> Dict[str, Any]:
        """
        Parse Vina output to extract binding affinities and RMSD values
        
        Args:
            vina_output: Raw output from Vina command
            output_file: Path to output PDBQT file
            
        Returns:
            Dictionary with parsed results
        """
        results = {
            'binding_affinity': None,
            'rmsd_lower_bound': None,
            'rmsd_upper_bound': None,
            'output_file': output_file
        }
        
        lines = vina_output.split('\n')
        for i, line in enumerate(lines):
            if 'REMARK VINA RESULT:' in line:
                parts = line.split()
                if len(parts) >= 6:
                    try:
                        results['binding_affinity'] = float(parts[3])
                        results['rmsd_lower_bound'] = float(parts[4])
                        results['rmsd_upper_bound'] = float(parts[5])
                        break
                    except (ValueError, IndexError):
                        continue
        
        return results
    
    async def process_docking_job(
        self,
        job_id: str,
        receptor_file: str,
        ligand_files: List[str],
        docking_params: Dict[str, Any]
    ) -> DockingResult:
        """
        Process a complete docking job with multiple ligands
        
        Args:
            job_id: Unique job identifier
            receptor_file: Path to receptor file
            ligand_files: List of ligand file paths
            docking_params: Docking parameters
            
        Returns:
            DockingResult object with all results
        """
        start_time = datetime.now()
        job_temp_dir = os.path.join(self.temp_dir, job_id)
        os.makedirs(job_temp_dir, exist_ok=True)
        
        try:
            # Prepare receptor
            receptor_pdbqt = os.path.join(job_temp_dir, 'receptor.pdbqt')
            self.prepare_receptor(receptor_file, receptor_pdbqt)
            
            ligand_results = []
            successful_docks = 0
            failed_docks = 0
            
            # Process each ligand
            for ligand_file in ligand_files:
                ligand_name = Path(ligand_file).stem
                try:
                    # Prepare ligand
                    ligand_pdbqt = os.path.join(job_temp_dir, f'{ligand_name}.pdbqt')
                    self.prepare_ligand(ligand_file, ligand_pdbqt)
                    
                    # Run docking
                    output_pdbqt = os.path.join(job_temp_dir, f'{ligand_name}_out.pdbqt')
                    vina_result = self.run_vina_docking(
                        receptor_pdbqt,
                        ligand_pdbqt,
                        output_pdbqt,
                        **docking_params
                    )
                    
                    # Create result
                    ligand_result = LigandResult(
                        ligand_name=ligand_name,
                        binding_affinity=vina_result.get('binding_affinity', 0.0),
                        rmsd_lower_bound=vina_result.get('rmsd_lower_bound', 0.0),
                        rmsd_upper_bound=vina_result.get('rmsd_upper_bound', 0.0),
                        pose_file=output_pdbqt
                    )
                    ligand_results.append(ligand_result)
                    successful_docks += 1
                    
                except Exception as e:
                    logger.error(f"Failed to dock ligand {ligand_name}: {str(e)}")
                    failed_docks += 1
            
            # Calculate processing time
            end_time = datetime.now()
            processing_time = (end_time - start_time).total_seconds()
            
            # Create final result
            result = DockingResult(
                job_id=job_id,
                status=DockingStatus.COMPLETED,
                receptor_name=Path(receptor_file).stem,
                ligand_results=ligand_results,
                total_ligands=len(ligand_files),
                successful_docks=successful_docks,
                failed_docks=failed_docks,
                processing_time=processing_time,
                created_at=start_time.isoformat(),
                completed_at=end_time.isoformat()
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Docking job {job_id} failed: {str(e)}")
            end_time = datetime.now()
            processing_time = (end_time - start_time).total_seconds()
            
            return DockingResult(
                job_id=job_id,
                status=DockingStatus.FAILED,
                receptor_name=Path(receptor_file).stem,
                ligand_results=[],
                total_ligands=len(ligand_files),
                successful_docks=0,
                failed_docks=len(ligand_files),
                processing_time=processing_time,
                error_message=str(e),
                created_at=start_time.isoformat(),
                completed_at=end_time.isoformat()
            )
        
        finally:
            # Clean up temporary files
            if os.path.exists(job_temp_dir):
                shutil.rmtree(job_temp_dir)

# Global service instance
vina_service = VinaService()
