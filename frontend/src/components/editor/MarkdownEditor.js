import React, { useEffect, useCallback, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

const markdownHighlightStyle = HighlightStyle.define([
  { tag: t.heading1, fontSize: '1.8em', fontWeight: 'bold', color: '#2563eb' },
  { tag: t.heading2, fontSize: '1.6em', fontWeight: 'bold', color: '#3b82f6' },
  { tag: t.heading3, fontSize: '1.4em', fontWeight: 'bold', color: '#60a5fa' },
  { tag: t.heading4, fontSize: '1.2em', fontWeight: 'bold', color: '#93c5fd' },
  { tag: t.heading5, fontSize: '1.1em', fontWeight: 'bold', color: '#bfdbfe' },
  { tag: t.heading6, fontSize: '1em', fontWeight: 'bold', color: '#dbeafe' },
  { tag: t.strong, fontWeight: 'bold', color: '#374151' },
  { tag: t.emphasis, fontStyle: 'italic', color: '#6b7280' },
  { tag: t.strikethrough, textDecoration: 'line-through', color: '#9ca3af' },
  { tag: t.link, color: '#3b82f6', textDecoration: 'underline' },
  { tag: t.monospace, fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace' },
]);

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
  },
  '.cm-content': {
    padding: '16px',
    minHeight: '100%',
    lineHeight: '1.6',
  },
  '.cm-focused': {
    outline: 'none',
  },
  '.cm-editor': {
    height: '100%',
  },
  '.cm-scroller': {
    height: '100%',
  },
  '.cm-line': {
    paddingLeft: '4px',
    paddingRight: '4px',
  },
  '.cm-activeLine': {
    backgroundColor: '#f8fafc',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#f1f5f9',
  },
  '.cm-gutters': {
    backgroundColor: '#f8fafc',
    border: 'none',
  },
  '.cm-lineNumbers': {
    color: '#94a3b8',
    fontSize: '12px',
  },
});

const MarkdownEditor = ({ 
  value, 
  onChange, 
  placeholder = "Start writing your markdown...",
  readOnly = false,
  theme = 'light'
}) => {
  const [currentTheme, setCurrentTheme] = useState(theme);

  useEffect(() => {
    // Listen for theme changes
    const savedTheme = localStorage.getItem('theme') || 'light';
    setCurrentTheme(savedTheme);
    
    const handleStorageChange = () => {
      const newTheme = localStorage.getItem('theme') || 'light';
      setCurrentTheme(newTheme);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const extensions = [
    markdown(),
    syntaxHighlighting(markdownHighlightStyle),
    EditorView.lineWrapping,
    editorTheme,
    EditorView.updateListener.of((update) => {
      if (update.docChanged && onChange) {
        onChange(update.state.doc.toString());
      }
    }),
  ];

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      const start = event.target.selectionStart;
      const end = event.target.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        event.target.selectionStart = event.target.selectionEnd = start + 2;
      }, 0);
    }
  }, [value, onChange]);

  return (
    <div className="h-full w-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-600">
      <CodeMirror
        value={value}
        height="100%"
        placeholder={placeholder}
        extensions={extensions}
        onChange={onChange}
        editable={!readOnly}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          highlightSelectionMatches: false,
        }}
        theme={currentTheme === 'dark' ? oneDark : undefined}
      />
    </div>
  );
};

export default MarkdownEditor;
