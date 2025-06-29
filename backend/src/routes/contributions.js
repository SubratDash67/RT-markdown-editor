const express = require('express');
const { supabase } = require('../utils/supabase');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

router.get('/document/:documentId', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_contributions')
      .select(`
        *,
        user:user_id (email)
      `)
      .eq('document_id', req.params.documentId)
      .order('last_activity', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/document/:documentId', authenticateUser, async (req, res) => {
  try {
    const {
      session_id,
      insertions = 0,
      deletions = 0,
      characters_added = 0,
      characters_removed = 0,
      time_spent_seconds = 0
    } = req.body;

    const { data, error } = await supabase
      .from('user_contributions')
      .upsert({
        document_id: req.params.documentId,
        user_id: req.user.id,
        session_id,
        insertions,
        deletions,
        characters_added,
        characters_removed,
        time_spent_seconds,
        last_activity: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/user/:userId', authenticateUser, async (req, res) => {
  try {
    const { document_id } = req.query;
    
    let query = supabase
      .from('user_contributions')
      .select(`
        *,
        document:documents (title)
      `)
      .eq('user_id', req.params.userId);

    if (document_id) {
      query = query.eq('document_id', document_id);
    }

    const { data, error } = await query.order('last_activity', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
