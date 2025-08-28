// frontend/components/ComposeEmailDialog.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  Chip,
  Typography,
  CircularProgress
} from '@mui/material';
import { 
  Close as CloseIcon,
  AutoAwesome as AIIcon,
  Send as SendIcon
} from '@mui/icons-material';

interface ComposeEmailDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (emailData: {
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
    type?: 'sales' | 'followup';
  }) => void;
}

const ComposeEmailDialog: React.FC<ComposeEmailDialogProps> = ({ open, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
  });
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailType, setEmailType] = useState<'sales' | 'followup'>('sales');

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const generateEmailWithAI = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    
    try {
      // First, route to determine email type
      const routeResponse = await fetch('http://localhost:3001/api/ai/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      
      const routeData = await routeResponse.json();
      const detectedType = routeData.type.content as 'sales' | 'followup';
      setEmailType(detectedType);
      
      // Then generate the email content
      const generateResponse = await fetch('http://localhost:3001/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: aiPrompt, 
          type: detectedType,
          recipient: formData.to || 'recipient'
        }),
      });

      if (generateResponse.ok) {
        const response = await generateResponse.json()
        console.log({response})
        setFormData(data => ({...data, subject: response.subject, body: response.content}))
      }
    } catch (error) {
      console.error('Error generating email:', error);
    } finally {
      setIsGenerating(false);
      setShowAiPrompt(false);
      setAiPrompt('');
    }
  };

  const handleSave = () => {
    if (!formData.to.trim() || (!formData.subject.trim() && !formData.body.trim())) {
      return; // Basic validation
    }
    
    onSave({
      ...formData,
      type: emailType
    });
    
    // Reset form
    setFormData({ to: '', cc: '', bcc: '', subject: '', body: '' });
    setEmailType('sales');
  };

  const handleClose = () => {
    setFormData({ to: '', cc: '', bcc: '', subject: '', body: '' });
    setEmailType('sales');
    setShowAiPrompt(false);
    setAiPrompt('');
    onClose();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sales': return 'primary';
      case 'followup': return 'secondary';
      default: return 'default';
    }
  };


  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          Compose Email
            <Chip 
              label={emailType.toUpperCase()} 
              color={getTypeColor(emailType)}
              size="small"
            />
        </Box>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="To"
            value={formData.to}
            onChange={handleInputChange('to')}
            fullWidth
            required
            size="small"
            disabled={isGenerating}
          />
          
          <TextField
            label="CC"
            value={formData.cc}
            onChange={handleInputChange('cc')}
            fullWidth
            size="small"
            disabled={isGenerating}
          />
          
          <TextField
            label="BCC"
            value={formData.bcc}
            onChange={handleInputChange('bcc')}
            fullWidth
            size="small"
            disabled={isGenerating}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              label="Subject"
              value={formData.subject}
              onChange={handleInputChange('subject')}
              fullWidth
              size="small"
              disabled={isGenerating}
            />
          </Box>

          <TextField
            label="Body"
            value={formData.body}
            onChange={handleInputChange('body')}
            fullWidth
            multiline
            rows={8}
            size="small"
            disabled={isGenerating}
          />
           {showAiPrompt && (
            <Box sx={{ p: 2, bgcolor: 'background.paper', border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Describe what the email should be about:
              </Typography>
              <TextField
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., Meeting request for Tuesday, Follow up on last week's proposal..."
                fullWidth
                multiline
                rows={2}
                size="small"
                sx={{ mb: 1 }}
                disabled={isGenerating}
              />
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button size="small" onClick={() => setShowAiPrompt(false)}>
                  Cancel
                </Button>
                <Button 
                  size="small" 
                  variant="contained" 
                  onClick={generateEmailWithAI}
                  disabled={!aiPrompt.trim() || isGenerating}
                  startIcon={isGenerating ? <CircularProgress size={16} /> : <AIIcon />}
                >
                  Generate
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{flexDirection:'row', justifyContent:'space-between'}}>
        <Button
              variant="outlined"
              startIcon={<AIIcon />}
              onClick={() => setShowAiPrompt(true)}
              disabled={isGenerating || showAiPrompt}
              sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
            >
              AI
        </Button>
        <Box>
            <Button onClick={handleClose}>Cancel</Button>
            <Button 
            onClick={handleSave}
            variant="contained"
            startIcon={<SendIcon />}
            disabled={!formData.to.trim() || (!formData.subject.trim() && !formData.body.trim())}
            >
            Save Email
            </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ComposeEmailDialog;