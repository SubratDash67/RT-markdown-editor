const express = require('express');
const { supabase } = require('../utils/supabase');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('owner_id', req.user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', req.params.id)
      .eq('owner_id', req.user.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(404).json({ error: 'Document not found' });
  }
});

router.post('/', authenticateUser, async (req, res) => {
  try {
    const { title, content } = req.body;
    const { data, error } = await supabase
      .from('documents')
      .insert([{
        title: title || 'Untitled Document',
        content: content || '',
        owner_id: req.user.id,
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { title, content } = req.body;
    const { data, error } = await supabase
      .from('documents')
      .update({
        title,
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .eq('owner_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', req.params.id)
      .eq('owner_id', req.user.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
