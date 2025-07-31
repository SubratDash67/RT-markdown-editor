import { supabase } from './supabase';

export class ShareManager {
  static generateShareToken() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  static async createShare(documentId, permissionLevel = 'view', expiresInDays = null) {
    try {
      const shareToken = this.generateShareToken();
      const expiresAt = expiresInDays 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from('document_shares')
        .insert([{
          document_id: documentId,
          token: shareToken, // Fixed: should be 'token' not 'share_token'
          access_level: permissionLevel, // Fixed: should be 'access_level' not 'permission_level'
          expires_at: expiresAt,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  static async getShares(documentId) {
    const { data, error } = await supabase
      .from('document_shares')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  static async getDocumentByToken(shareToken) {
    const { data: share, error: shareError } = await supabase
      .from('document_shares')
      .select(`
        *,
        document:documents (*)
      `)
      .eq('token', shareToken) // Fixed: should be 'token' not 'share_token'
      .single();

    if (shareError) return { data: null, error: shareError };

    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return { data: null, error: { message: 'Share link has expired' } };
    }

    return { data: share, error: null };
  }

  static async revokeShare(shareId) {
    const { data, error } = await supabase
      .from('document_shares')
      .delete() // Since we don't have is_active, just delete the share
      .eq('id', shareId)
      .select()
      .single();

    return { data, error };
  }

  static buildShareUrl(shareToken) {
    const baseUrl = process.env.REACT_APP_FRONTEND_URL || window.location.origin;
    return `${baseUrl}/shared/${shareToken}`;
  }
}
