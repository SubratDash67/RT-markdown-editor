import { supabase } from './supabase';
import * as Y from 'yjs'; // Add this import if using Y.js types

export class ContributionTracker {
  constructor(documentId, userId) {
    this.documentId = documentId;
    this.userId = userId;
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.lastContent = '';
    this.totalInsertions = 0;
    this.totalDeletions = 0;
    this.totalCharactersAdded = 0;
    this.totalCharactersRemoved = 0;
    this.saveInterval = null;
    this.isActive = true;
  }

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  start() {
    this.saveInterval = setInterval(() => {
      if (this.isActive) {
        this.saveContribution();
      }
    }, 30000); // Save every 30 seconds
  }

  stop() {
    this.isActive = false;
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    this.saveContribution();
  }

  trackChange(newContent) {
    if (!this.isActive) return;

    const oldContent = this.lastContent;
    const { insertions, deletions, charactersAdded, charactersRemoved } = 
      this.calculateDiff(oldContent, newContent);

    this.totalInsertions += insertions;
    this.totalDeletions += deletions;
    this.totalCharactersAdded += charactersAdded;
    this.totalCharactersRemoved += charactersRemoved;
    this.lastContent = newContent;
  }

  calculateDiff(oldContent, newContent) {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    let insertions = 0;
    let deletions = 0;
    let charactersAdded = 0;
    let charactersRemoved = 0;

    // Simple diff calculation
    if (newContent.length > oldContent.length) {
      charactersAdded = newContent.length - oldContent.length;
    } else if (oldContent.length > newContent.length) {
      charactersRemoved = oldContent.length - newContent.length;
    }

    if (newLines.length > oldLines.length) {
      insertions = newLines.length - oldLines.length;
    } else if (oldLines.length > newLines.length) {
      deletions = oldLines.length - newLines.length;
    }

    return { insertions, deletions, charactersAdded, charactersRemoved };
  }

  async saveContribution() {
    if (!this.isActive) return;

    const timeSpentSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    try {
      const { error } = await supabase
        .from('user_contributions')
        .upsert({
          document_id: this.documentId,
          user_id: this.userId,
          session_id: this.sessionId,
          insertions: this.totalInsertions,
          deletions: this.totalDeletions,
          characters_added: this.totalCharactersAdded,
          characters_removed: this.totalCharactersRemoved,
          time_spent_seconds: timeSpentSeconds,
          last_activity: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to save contribution:', error);
      }
    } catch (error) {
      console.error('Error saving contribution:', error);
    }
  }

  static async getDocumentContributions(documentId) {
    const { data, error } = await supabase
      .from('user_contributions')
      .select(`
        *,
        user:user_id (email)
      `)
      .eq('document_id', documentId)
      .order('last_activity', { ascending: false });

    return { data, error };
  }

  static async getUserContributions(userId, documentId = null) {
    let query = supabase
      .from('user_contributions')
      .select(`
        *,
        document:documents (title)
      `)
      .eq('user_id', userId);

    if (documentId) {
      query = query.eq('document_id', documentId);
    }

    const { data, error } = await query.order('last_activity', { ascending: false });
    return { data, error };
  }
}
