import { supabase } from './supabase';

export class VersionManager {
  static async createVersion(documentId, title, content, changesSummary = '') {
    try {
      const { data: latestVersion } = await supabase
        .from('document_versions')
        .select('version_number')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      const newVersionNumber = (latestVersion?.version_number || 0) + 1;

      const { data, error } = await supabase
        .from('document_versions')
        .insert([{
          document_id: documentId,
          version_number: newVersionNumber,
          title,
          content,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          changes_summary: changesSummary
        }])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  static async getVersions(documentId) {
    const { data, error } = await supabase
      .from('document_versions')
      .select(`
        *,
        created_by_user:created_by (email)
      `)
      .eq('document_id', documentId)
      .order('version_number', { ascending: false });

    return { data, error };
  }

  static async getVersion(documentId, versionNumber) {
    const { data, error } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', documentId)
      .eq('version_number', versionNumber)
      .single();

    return { data, error };
  }

  static async restoreVersion(documentId, versionNumber) {
    try {
      const { data: version, error: versionError } = await this.getVersion(documentId, versionNumber);
      if (versionError) return { data: null, error: versionError };

      const { data, error } = await supabase
        .from('documents')
        .update({
          title: version.title,
          content: version.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single();

      if (!error) {
        await this.createVersion(
          documentId, 
          version.title, 
          version.content, 
          `Restored from version ${versionNumber}`
        );
      }

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  static generateChangesSummary(oldContent, newContent) {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    let additions = 0;
    let deletions = 0;
    let modifications = 0;

    const maxLength = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxLength; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';
      
      if (!oldLine && newLine) additions++;
      else if (oldLine && !newLine) deletions++;
      else if (oldLine !== newLine) modifications++;
    }

    const parts = [];
    if (additions > 0) parts.push(`+${additions} lines`);
    if (deletions > 0) parts.push(`-${deletions} lines`);
    if (modifications > 0) parts.push(`~${modifications} modified`);
    
    return parts.length > 0 ? parts.join(', ') : 'No changes';
  }
}
