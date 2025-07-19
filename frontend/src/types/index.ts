export interface DockingJob {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  receptor_name: string;
  ligand_results: LigandResult[];
  total_ligands: number;
  successful_docks: number;
  failed_docks: number;
  processing_time?: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface LigandResult {
  ligand_name: string;
  binding_affinity: number;
  rmsd_lower_bound: number;
  rmsd_upper_bound: number;
  pose_file?: string;
}

export interface DockingJobResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface DockingParameters {
  center_x: number;
  center_y: number;
  center_z: number;
  size_x: number;
  size_y: number;
  size_z: number;
  exhaustiveness: number;
  num_modes: number;
}
