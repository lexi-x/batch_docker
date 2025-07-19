import React, { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Grid,
  TextField,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  ExpandMore as ExpandMoreIcon,
  Science as ScienceIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { dockingApi } from '../services/api';
import { DockingParameters } from '../types';

interface DockingUploadProps {
  onJobSubmitted: (jobId: string) => void;
}

const DockingUpload: React.FC<DockingUploadProps> = ({ onJobSubmitted }) => {
  const [receptorFile, setReceptorFile] = useState<File | null>(null);
  const [ligandFiles, setLigandFiles] = useState<File[]>([]);
  const [parameters, setParameters] = useState<DockingParameters>({
    center_x: 0.0,
    center_y: 0.0,
    center_z: 0.0,
    size_x: 20.0,
    size_y: 20.0,
    size_z: 20.0,
    exhaustiveness: 8,
    num_modes: 9,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onReceptorDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setReceptorFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const onLigandDrop = useCallback((acceptedFiles: File[]) => {
    setLigandFiles(prev => [...prev, ...acceptedFiles]);
    setError(null);
  }, []);

  const receptorDropzone = useDropzone({
    onDrop: onReceptorDrop,
    accept: {
      'chemical/x-pdb': ['.pdb'],
      'chemical/x-pdbqt': ['.pdbqt'],
    },
    maxFiles: 1,
  });

  const ligandDropzone = useDropzone({
    onDrop: onLigandDrop,
    accept: {
      'chemical/x-pdb': ['.pdb'],
      'chemical/x-pdbqt': ['.pdbqt'],
      'chemical/x-sdf': ['.sdf'],
      'chemical/x-mol2': ['.mol2'],
    },
    multiple: true,
  });

  const handleParameterChange = (field: keyof DockingParameters, value: number) => {
    setParameters(prev => ({ ...prev, [field]: value }));
  };

  const removeLigandFile = (index: number) => {
    setLigandFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!receptorFile) {
      setError('Please upload a receptor file');
      return;
    }

    if (ligandFiles.length === 0) {
      setError('Please upload at least one ligand file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await dockingApi.submitDockingJob(
        receptorFile,
        ligandFiles,
        parameters
      );
      onJobSubmitted(response.job_id);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit docking job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
        Submit Molecular Docking Job
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Receptor Upload */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Receptor File
              </Typography>
              <Box
                {...receptorDropzone.getRootProps()}
                sx={{
                  border: '2px dashed',
                  borderColor: receptorDropzone.isDragActive ? 'primary.main' : 'grey.300',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  bgcolor: receptorDropzone.isDragActive ? 'action.hover' : 'background.paper',
                  transition: 'all 0.2s ease',
                }}
              >
                <input {...receptorDropzone.getInputProps()} />
                <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="body1" gutterBottom>
                  {receptorFile ? receptorFile.name : 'Drop receptor file here or click to browse'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supported formats: PDB, PDBQT
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Ligand Upload */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ligand Files
              </Typography>
              <Box
                {...ligandDropzone.getRootProps()}
                sx={{
                  border: '2px dashed',
                  borderColor: ligandDropzone.isDragActive ? 'primary.main' : 'grey.300',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  bgcolor: ligandDropzone.isDragActive ? 'action.hover' : 'background.paper',
                  transition: 'all 0.2s ease',
                  mb: 2,
                }}
              >
                <input {...ligandDropzone.getInputProps()} />
                <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="body1" gutterBottom>
                  Drop ligand files here or click to browse
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supported formats: PDB, PDBQT, SDF, MOL2
                </Typography>
              </Box>

              {ligandFiles.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Ligands ({ligandFiles.length}):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {ligandFiles.map((file, index) => (
                      <Chip
                        key={index}
                        label={file.name}
                        onDelete={() => removeLigandFile(index)}
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Docking Parameters */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                <ScienceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Docking Parameters
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Binding Site Center (Å)
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Center X"
                    type="number"
                    value={parameters.center_x}
                    onChange={(e) => handleParameterChange('center_x', parseFloat(e.target.value))}
                    size="small"
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Center Y"
                    type="number"
                    value={parameters.center_y}
                    onChange={(e) => handleParameterChange('center_y', parseFloat(e.target.value))}
                    size="small"
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Center Z"
                    type="number"
                    value={parameters.center_z}
                    onChange={(e) => handleParameterChange('center_z', parseFloat(e.target.value))}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Search Space Size (Å)
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Size X"
                    type="number"
                    value={parameters.size_x}
                    onChange={(e) => handleParameterChange('size_x', parseFloat(e.target.value))}
                    size="small"
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Size Y"
                    type="number"
                    value={parameters.size_y}
                    onChange={(e) => handleParameterChange('size_y', parseFloat(e.target.value))}
                    size="small"
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Size Z"
                    type="number"
                    value={parameters.size_z}
                    onChange={(e) => handleParameterChange('size_z', parseFloat(e.target.value))}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Advanced Parameters
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Exhaustiveness"
                    type="number"
                    value={parameters.exhaustiveness}
                    onChange={(e) => handleParameterChange('exhaustiveness', parseInt(e.target.value))}
                    size="small"
                    inputProps={{ min: 1, max: 32 }}
                    helperText="Higher values = more thorough search"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Number of Modes"
                    type="number"
                    value={parameters.num_modes}
                    onChange={(e) => handleParameterChange('num_modes', parseInt(e.target.value))}
                    size="small"
                    inputProps={{ min: 1, max: 20 }}
                    helperText="Number of binding poses to generate"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Submit Button */}
        <Grid item xs={12}>
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={loading || !receptorFile || ligandFiles.length === 0}
              startIcon={loading ? <CircularProgress size={20} /> : <ScienceIcon />}
              sx={{ px: 4, py: 1.5 }}
            >
              {loading ? 'Submitting...' : 'Submit Docking Job'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DockingUpload;
