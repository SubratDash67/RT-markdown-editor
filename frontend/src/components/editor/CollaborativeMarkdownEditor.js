import React, { useEffect, useCallback, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { useCollaborativeEditor } from '../../hooks/useCollaborativeEditor';

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
  '.cm-ySelectionInfo': {
    position: 'absolute',
    top: '-1.5em',
    left: '0',
    fontSize: '12px',
    fontFamily: 'Inter, sans-serif',
    fontWeight: '500',
    color: 'white',
    backgroundColor: 'var(--user-color)',
    padding: '2px 6px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
    zIndex: '10',
    pointerEvents: 'none',
  },
  '.cm-ySelectionCaret': {
    position: 'relative',
    borderLeft: '2px solid var(--user-color)',
    borderRight: '2px solid var(--user-color)',
    marginLeft: '-1px',
    marginRight: '-1px',
  },
  '.cm-ySelectionCaret::before': {
    content: '""',
    position: 'absolute',
    top: '-2px',
    left: '-2px',
    width: '4px',
    height: '4px',
    backgroundColor: 'var(--user-color)',
    borderRadius: '50%',
  },
});

const CollaborativeMarkdownEditor = ({ 
  placeholder = "Start writing your collaborative markdown...",
  readOnly = false,
  theme = 'light'
}) => {
  const { ytext, collaborativeExtensions, isConnected } = useCollaborativeEditor();
  const editorRef = useRef(null);

  const extensions = [
    markdown(),
    syntaxHighlighting(markdownHighlightStyle),
    EditorView.lineWrapping,
    editorTheme,
    ...collaborativeExtensions,
  ];

  const value = ytext ? ytext.toString() : '';

  return (
    <div className="h-full w-full bg-white border-r border-gray-200 relative">
      {!isConnected && (
        <div className="absolute top-2 right-2 z-10 bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
          Connecting...
        </div>
      )}
      
      <CodeMirror
        ref={editorRef}
        value={value}
        height="100%"
        placeholder={placeholder}
        extensions={extensions}
        editable={!readOnly && !!ytext}
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
        theme={theme === 'dark' ? oneDark : undefined}
      />
    </div>
  );
};

export default CollaborativeMarkdownEditor;
