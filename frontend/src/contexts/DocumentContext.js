import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabase';

const DocumentContext = createContext();

export const useDocument = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
};

export const DocumentProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentDocument, setCurrentDocument] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  const createDocument = async (title = 'Untitled Document') => {
    if (!user) return { error: 'User not authenticated' };

    const defaultContent = '# Welcome to your new document\n\nStart typing here...';
    
    const { data, error } = await supabase
      .from('documents')
      .insert([
        {
          title,
          content: defaultContent,
          owner_id: user.id,
        }
      ])
      .select()
      .single();

    if (!error) {
      setDocuments(prev => [data, ...prev]);
      setCurrentDocument(data);
    }

    return { data, error };
  };

  const loadDocument = async (documentId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (!error) {
      setCurrentDocument(data);
    }
    setLoading(false);
    return { data, error };
  };

  const updateDocument = async (documentId, updates) => {
    // Prevent unnecessary updates if content hasn't changed
    if (currentDocument && 
        updates.content === currentDocument.content && 
        updates.title === currentDocument.title) {
      return { data: currentDocument, error: null };
    }

    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', documentId)
      .select()
      .single();

    if (!error) {
      setCurrentDocument(data);
      setDocuments(prev => 
        prev.map(doc => doc.id === documentId ? data : doc)
      );
    }

    return { data, error };
  };

  const loadUserDocuments = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error) {
      setDocuments(data);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserDocuments();
    }
  }, [user]);

  const value = {
    currentDocument,
    documents,
    loading,
    createDocument,
    loadDocument,
    updateDocument,
    loadUserDocuments,
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};
