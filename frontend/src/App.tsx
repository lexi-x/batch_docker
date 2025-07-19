import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  AppBar,
  Toolbar,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { Science as ScienceIcon } from '@mui/icons-material';
import DockingUpload from './components/DockingUpload';
import JobStatus from './components/JobStatus';
import Results from './components/Results';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleJobSubmitted = (jobId: string) => {
    setCurrentJobId(jobId);
    setCurrentTab(1); // Switch to status tab
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <ScienceIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Molecular Docking Platform
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Powered by AutoDock Vina
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={0} sx={{ bgcolor: 'transparent' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={currentTab} onChange={handleTabChange} aria-label="docking tabs">
              <Tab label="Submit Docking Job" />
              <Tab label="Job Status" />
              <Tab label="Results" />
            </Tabs>
          </Box>

          <TabPanel value={currentTab} index={0}>
            <DockingUpload onJobSubmitted={handleJobSubmitted} />
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <JobStatus jobId={currentJobId} onJobCompleted={() => setCurrentTab(2)} />
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            <Results jobId={currentJobId} />
          </TabPanel>
        </Paper>
      </Container>
    </Box>
  );
}

export default App;
