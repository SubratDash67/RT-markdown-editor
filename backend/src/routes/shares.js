const express = require('express');
const { supabase } = require('../utils/supabase');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

const generateShareToken = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

router.get('/document/:documentId', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('document_shares')
      .select('*')
      .eq('document_id', req.params.documentId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/document/:documentId', authenticateUser, async (req, res) => {
  try {
    const { permission_level = 'view', expires_in_days } = req.body;
    const shareToken = generateShareToken();
    const expiresAt = expires_in_days 
      ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('document_shares')
      .insert([{
        document_id: req.params.documentId,
        share_token: shareToken,
        permission_level,
        expires_at: expiresAt,
        created_by: req.user.id
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/token/:shareToken', async (req, res) => {
  try {
    const { data: share, error: shareError } = await supabase
      .from('document_shares')
      .select(`
        *,
        document:documents (*)
      `)
      .eq('share_token', req.params.shareToken)
      .eq('is_active', true)
      .single();

    if (shareError) throw shareError;

    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Share link has expired' });
    }

    res.json(share);
  } catch (error) {
    res.status(404).json({ error: 'Share not found' });
  }
});

router.delete('/:shareId', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('document_shares')
      .update({ is_active: false })
      .eq('id', req.params.shareId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
