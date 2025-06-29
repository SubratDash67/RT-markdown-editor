const express = require('express');
const { supabase } = require('../utils/supabase');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

router.get('/document/:documentId', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('document_versions')
      .select(`
        *,
        created_by_user:created_by (email)
      `)
      .eq('document_id', req.params.documentId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/document/:documentId', authenticateUser, async (req, res) => {
  try {
    const { title, content, changes_summary } = req.body;
    
    const { data: latestVersion } = await supabase
      .from('document_versions')
      .select('version_number')
      .eq('document_id', req.params.documentId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const newVersionNumber = (latestVersion?.version_number || 0) + 1;

    const { data, error } = await supabase
      .from('document_versions')
      .insert([{
        document_id: req.params.documentId,
        version_number: newVersionNumber,
        title,
        content,
        created_by: req.user.id,
        changes_summary
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/document/:documentId/version/:versionNumber', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', req.params.documentId)
      .eq('version_number', req.params.versionNumber)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(404).json({ error: 'Version not found' });
  }
});

router.post('/document/:documentId/restore/:versionNumber', authenticateUser, async (req, res) => {
  try {
    const { data: version, error: versionError } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', req.params.documentId)
      .eq('version_number', req.params.versionNumber)
      .single();

    if (versionError) throw versionError;

    const { data, error } = await supabase
      .from('documents')
      .update({
        title: version.title,
        content: version.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.documentId)
      .select()
      .single();

    if (error) throw error;

    // Create new version for the restore
    await supabase
      .from('document_versions')
      .insert([{
        document_id: req.params.documentId,
        version_number: (await supabase
          .from('document_versions')
          .select('version_number')
          .eq('document_id', req.params.documentId)
          .order('version_number', { ascending: false })
          .limit(1)
          .single()).data.version_number + 1,
        title: version.title,
        content: version.content,
        created_by: req.user.id,
        changes_summary: `Restored from version ${req.params.versionNumber}`
      }]);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
