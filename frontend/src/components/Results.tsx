import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert,
  Chip,
  Grid,
  TableSortLabel,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Science as ScienceIcon,
  TrendingDown as AffinityIcon,
} from '@mui/icons-material';
import { dockingApi } from '../services/api';
import { DockingJob, LigandResult } from '../types';

interface ResultsProps {
  jobId: string | null;
}

type SortField = 'ligand_name' | 'binding_affinity' | 'rmsd_lower_bound' | 'rmsd_upper_bound';
type SortDirection = 'asc' | 'desc';

const Results: React.FC<ResultsProps> = ({ jobId }) => {
  const [job, setJob] = useState<DockingJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('binding_affinity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const fetchResults = async () => {
    if (!jobId) return;

    setLoading(true);
    setError(null);

    try {
      const jobData = await dockingApi.getJobStatus(jobId);
      setJob(jobData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchResults();
    }
  }, [jobId, fetchResults]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedResults = job?.ligand_results.slice().sort((a, b) => {
    let aValue: number | string = a[sortField];
    let bValue: number | string = b[sortField];

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = (bValue as string).toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  }) || [];

  const handleDownload = async () => {
    if (!jobId) return;

    try {
      const blob = await dockingApi.downloadResults(jobId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `docking_results_${jobId}.pdbqt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError('Failed to download results');
    }
  };

  const getAffinityColor = (affinity: number) => {
    if (affinity <= -10) return 'success';
    if (affinity <= -8) return 'info';
    if (affinity <= -6) return 'warning';
    return 'error';
  };

  const getBestResult = (): LigandResult | null => {
    if (!job?.ligand_results.length) return null;
    return job.ligand_results.reduce((best, current) => 
      current.binding_affinity < best.binding_affinity ? current : best
    );
  };

  if (!jobId) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No job selected. Please submit and complete a docking job first.
        </Typography>
      </Box>
    );
  }

  if (!job || job.status !== 'completed') {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          {job?.status === 'failed' 
            ? 'Job failed. Please check the job status for error details.'
            : 'Job not completed yet. Please wait for the docking to finish.'
          }
        </Typography>
      </Box>
    );
  }

  const bestResult = getBestResult();

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
        Docking Results
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ScienceIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h5" gutterBottom>
                {job.successful_docks}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Successful Docks
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AffinityIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h5" gutterBottom>
                {bestResult?.binding_affinity.toFixed(2) || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Best Affinity (kcal/mol)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom color="info.main">
                {job.processing_time?.toFixed(1) || 'N/A'}s
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Processing Time
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                fullWidth
              >
                Download Results
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Best Result Highlight */}
      {bestResult && (
        <Card sx={{ mb: 3, bgcolor: 'success.50', border: '2px solid', borderColor: 'success.main' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="success.main">
              🏆 Best Docking Result
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">Ligand</Typography>
                <Typography variant="h6">{bestResult.ligand_name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">Binding Affinity</Typography>
                <Typography variant="h6" color="success.main">
                  {bestResult.binding_affinity.toFixed(2)} kcal/mol
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">RMSD Lower</Typography>
                <Typography variant="h6">{bestResult.rmsd_lower_bound.toFixed(2)} Å</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">RMSD Upper</Typography>
                <Typography variant="h6">{bestResult.rmsd_upper_bound.toFixed(2)} Å</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Docking Results ({sortedResults.length} ligands)
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'ligand_name'}
                      direction={sortField === 'ligand_name' ? sortDirection : 'asc'}
                      onClick={() => handleSort('ligand_name')}
                    >
                      Ligand Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortField === 'binding_affinity'}
                      direction={sortField === 'binding_affinity' ? sortDirection : 'asc'}
                      onClick={() => handleSort('binding_affinity')}
                    >
                      Binding Affinity (kcal/mol)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortField === 'rmsd_lower_bound'}
                      direction={sortField === 'rmsd_lower_bound' ? sortDirection : 'asc'}
                      onClick={() => handleSort('rmsd_lower_bound')}
                    >
                      RMSD Lower (Å)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortField === 'rmsd_upper_bound'}
                      direction={sortField === 'rmsd_upper_bound' ? sortDirection : 'asc'}
                      onClick={() => handleSort('rmsd_upper_bound')}
                    >
                      RMSD Upper (Å)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">Quality</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedResults.map((result, index) => (
                  <TableRow 
                    key={index}
                    sx={{ 
                      bgcolor: result === bestResult ? 'success.50' : 'inherit',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {result === bestResult && <span>🏆</span>}
                        <Typography variant="body2" fontWeight={result === bestResult ? 'bold' : 'normal'}>
                          {result.ligand_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        fontWeight={result === bestResult ? 'bold' : 'normal'}
                        color={result === bestResult ? 'success.main' : 'inherit'}
                      >
                        {result.binding_affinity.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {result.rmsd_lower_bound.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      {result.rmsd_upper_bound.toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={
                          result.binding_affinity <= -10 ? 'Excellent' :
                          result.binding_affinity <= -8 ? 'Good' :
                          result.binding_affinity <= -6 ? 'Fair' : 'Poor'
                        }
                        color={getAffinityColor(result.binding_affinity) as any}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              * Lower binding affinity values indicate stronger binding. 
              RMSD values indicate structural similarity to reference poses.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Results;
