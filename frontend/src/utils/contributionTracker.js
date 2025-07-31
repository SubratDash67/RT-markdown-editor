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
    // Initialize lastContent with current content if available
    if (!this.lastContent) {
      this.lastContent = '';
    }
    
    this.saveInterval = setInterval(() => {
      if (this.isActive) {
        this.saveContribution();
      }
    }, 30000); // Save every 30 seconds
    
    // Save immediately on start to create the session
    this.saveContribution();
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

    const oldContent = this.lastContent || '';
    
    // Only track if content actually changed
    if (newContent === oldContent) return;

    const { insertions, deletions, charactersAdded, charactersRemoved } = 
      this.calculateDiff(oldContent, newContent);

    this.totalInsertions += insertions;
    this.totalDeletions += deletions;
    this.totalCharactersAdded += charactersAdded;
    this.totalCharactersRemoved += charactersRemoved;
    this.lastContent = newContent;

    // Log the changes for debugging
    if (insertions > 0 || deletions > 0 || charactersAdded > 0 || charactersRemoved > 0) {
      console.log('Contribution tracked:', {
        insertions,
        deletions,
        charactersAdded,
        charactersRemoved,
        totalInsertions: this.totalInsertions,
        totalDeletions: this.totalDeletions,
        totalCharactersAdded: this.totalCharactersAdded,
        totalCharactersRemoved: this.totalCharactersRemoved
      });
    }
  }

  calculateDiff(oldContent, newContent) {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    let insertions = 0;
    let deletions = 0;
    let charactersAdded = 0;
    let charactersRemoved = 0;

    // Character-level diff
    if (newContent.length > oldContent.length) {
      charactersAdded = newContent.length - oldContent.length;
    } else if (oldContent.length > newContent.length) {
      charactersRemoved = oldContent.length - newContent.length;
    }

    // Line-level diff using a simple LCS approach
    const maxLines = Math.max(oldLines.length, newLines.length);
    const minLines = Math.min(oldLines.length, newLines.length);
    
    // Count actual line changes
    let unchangedLines = 0;
    for (let i = 0; i < minLines; i++) {
      if (oldLines[i] === newLines[i]) {
        unchangedLines++;
      }
    }

    if (newLines.length > oldLines.length) {
      insertions = newLines.length - oldLines.length;
    } else if (oldLines.length > newLines.length) {
      deletions = oldLines.length - newLines.length;
    }

    // Handle modified lines as both insertion and deletion
    const modifiedLines = minLines - unchangedLines;
    if (modifiedLines > 0 && newLines.length === oldLines.length) {
      insertions += modifiedLines;
      deletions += modifiedLines;
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
        }, { 
          onConflict: 'document_id,user_id,session_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Failed to save contribution:', error);
      } else {
        console.log('Contribution saved successfully:', {
          insertions: this.totalInsertions,
          deletions: this.totalDeletions,
          characters_added: this.totalCharactersAdded,
          characters_removed: this.totalCharactersRemoved,
          time_spent_seconds: timeSpentSeconds
        });
      }
    } catch (error) {
      console.error('Error saving contribution:', error);
    }
  }

  static async getDocumentContributions(documentId) {
    try {
      console.log('Fetching contributions for document:', documentId);
      
      const { data, error } = await supabase
        .from('user_contributions')
        .select('*') // Simplified: just get the contributions without trying to join user data
        .eq('document_id', documentId)
        .order('last_activity', { ascending: false });

      if (error) {
        console.error('Database error fetching contributions:', error);
        return { data: [], error };
      }

      console.log('Fetched contributions:', data?.length || 0, 'records');
      return { data: data || [], error: null };
    } catch (exception) {
      console.error('Exception fetching contributions:', exception);
      return { data: [], error: exception };
    }
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
