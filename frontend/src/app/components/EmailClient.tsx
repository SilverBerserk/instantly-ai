// frontend/pages/index.tsx
"use client"
import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  Fab,
  Paper,
  Divider,
  Chip
} from '@mui/material';
import { Edit as EditIcon, Email as EmailIcon } from '@mui/icons-material';
import ComposeEmailDialog from './ComposeEmailDialog';

const DRAWER_WIDTH = 320;

interface Email {
  id: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  created_at: string;
  type?: 'sales' | 'followup';
}

const EmailClient = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [loading, setLoading] = useState(true);


  
  // Fetch emails from backend
  const fetchEmails = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/emails');
      const data = await response.json();
      setEmails(data);
      if (data.length > 0 && !selectedEmail) {
        setSelectedEmail(data[0]);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleSaveEmail = async (emailData: Omit<Email, 'id' | 'created_at'>) => {
    try {
      const response = await fetch('http://localhost:3001/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      });
      
      if (response.ok) {
        const newEmail = await response.json();
        setEmails(prev => [newEmail, ...prev]);
        setSelectedEmail(newEmail);
        setComposeOpen(false);
      }
    } catch (error) {
      console.error('Error saving email:', error);
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEmailTypeColor = (type?: string) => {
    switch (type) {
      case 'sales': return 'primary';
      case 'followup': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid #e0e0e0'
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmailIcon color="primary" />
            Instantly.AI Mail
          </Typography>
        </Box>

        <List sx={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <ListItem>
              <ListItemText primary="Loading..." />
            </ListItem>
          ) : emails.length === 0 ? (
            <ListItem>
              <ListItemText 
                primary="No emails yet" 
                secondary="Click + to compose your first email"
              />
            </ListItem>
          ) : (
            emails.map((email) => (
              <ListItemButton
                key={email.id}
                selected={selectedEmail?.id === email.id}
                onClick={() => setSelectedEmail(email)}
                sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1.5 }}
              >
                <Box sx={{ width: '100%', mb: 0.5 }}>
                  <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
                    To: {email.to}
                  </Typography>
                </Box>
                
                <Box sx={{ width: '100%', mb: 0.5 }}>
                  <Typography variant="body2" noWrap sx={{ color: 'text.primary' }}>
                    {email.subject || 'No subject'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {formatDate(email.created_at)}
                  </Typography>
                  {email.type && (
                    <Chip 
                      label={email.type} 
                      size="small" 
                      color={getEmailTypeColor(email.type)}
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  )}
                </Box>
              </ListItemButton>
            ))
          )}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedEmail ? (
          <Paper sx={{ flex: 1, m: 2, p: 3, overflow: 'auto' }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                {selectedEmail.subject || 'No subject'}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  <strong>To:</strong> {selectedEmail.to}
                </Typography>
                {selectedEmail.cc && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                    <strong>CC:</strong> {selectedEmail.cc}
                  </Typography>
                )}
                {selectedEmail.bcc && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                    <strong>BCC:</strong> {selectedEmail.bcc}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  <strong>Date:</strong> {formatDate(selectedEmail.created_at)}
                </Typography>
                {selectedEmail.type && (
                  <Chip 
                    label={`${selectedEmail.type.toUpperCase()} EMAIL`} 
                    color={getEmailTypeColor(selectedEmail.type)}
                    size="small"
                  />
                )}
              </Box>

              <Divider sx={{ my: 2 }} />
            </Box>

            <Typography 
              variant="body1" 
              sx={{ 
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                fontFamily: '"Segoe UI", "Roboto", sans-serif'
              }}
            >
              {selectedEmail.body}
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2
          }}>
            <EmailIcon sx={{ fontSize: 80, color: 'text.disabled' }} />
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
              Select an email to view
            </Typography>
          </Box>
        )}
      </Box>

      {/* Compose FAB */}
      <Fab
        color="primary"
        aria-label="compose"
        onClick={() => setComposeOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000
        }}
      >
        <EditIcon />
      </Fab>

      {/* Compose Dialog */}
      <ComposeEmailDialog
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSave={handleSaveEmail}
      />
    </Box>
  );
};

export default EmailClient;