import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Alert,
  Chip,
  Grid,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { dockingApi } from '../services/api';
import { DockingJob } from '../types';

interface JobStatusProps {
  jobId: string | null;
  onJobCompleted: () => void;
}

const JobStatus: React.FC<JobStatusProps> = ({ jobId, onJobCompleted }) => {
  const [job, setJob] = useState<DockingJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobStatus = async () => {
    if (!jobId) return;

    setLoading(true);
    setError(null);

    try {
      const jobData = await dockingApi.getJobStatus(jobId);
      setJob(jobData);

      if (jobData.status === 'completed') {
        onJobCompleted();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch job status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchJobStatus();
      
      // Poll for updates every 5 seconds if job is still processing
      const interval = setInterval(() => {
        if (job?.status === 'pending' || job?.status === 'processing') {
          fetchJobStatus();
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [jobId, job?.status, fetchJobStatus]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'processing':
        return <CircularProgress size={24} />;
      default:
        return <PendingIcon color="warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'processing':
        return 'info';
      default:
        return 'warning';
    }
  };

  const getProgressValue = () => {
    if (!job) return 0;
    
    switch (job.status) {
      case 'pending':
        return 10;
      case 'processing':
        return job.successful_docks > 0 
          ? (job.successful_docks / job.total_ligands) * 80 + 10
          : 20;
      case 'completed':
        return 100;
      case 'failed':
        return 100;
      default:
        return 0;
    }
  };

  if (!jobId) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No job selected. Please submit a docking job first.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
        Job Status
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Job ID: {jobId}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={fetchJobStatus}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                >
                  Refresh
                </Button>
              </Box>
            </Grid>

            {job && (
              <>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    {getStatusIcon(job.status)}
                    <Chip
                      label={job.status.toUpperCase()}
                      color={getStatusColor(job.status) as any}
                      variant="filled"
                    />
                    <Typography variant="body1">
                      Receptor: <strong>{job.receptor_name}</strong>
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom>
                    Progress
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={getProgressValue()}
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {job.status === 'processing' 
                      ? `Processing ligands... (${job.successful_docks}/${job.total_ligands} completed)`
                      : job.status === 'completed'
                      ? 'Docking completed successfully'
                      : job.status === 'failed'
                      ? 'Docking failed'
                      : 'Job queued for processing'
                    }
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h4" color="primary" gutterBottom>
                        {job.total_ligands}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Ligands
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h4" color="success.main" gutterBottom>
                        {job.successful_docks}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Successful Docks
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {job.failed_docks > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h4" color="error.main" gutterBottom>
                          {job.failed_docks}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Failed Docks
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {job.processing_time && (
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h4" color="info.main" gutterBottom>
                          {job.processing_time.toFixed(1)}s
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Processing Time
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Created:</strong> {new Date(job.created_at).toLocaleString()}
                  </Typography>
                  {job.completed_at && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Completed:</strong> {new Date(job.completed_at).toLocaleString()}
                    </Typography>
                  )}
                </Grid>

                {job.error_message && (
                  <Grid item xs={12}>
                    <Alert severity="error">
                      <Typography variant="body2">
                        <strong>Error:</strong> {job.error_message}
                      </Typography>
                    </Alert>
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default JobStatus;
