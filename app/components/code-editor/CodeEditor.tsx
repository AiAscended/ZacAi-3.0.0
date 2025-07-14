// File: /app/components/code-editor/CodeEditor.tsx

import React from 'react';

/**
 * @interface CodeEditorProps
 * @description Props for the CodeEditor component.
 * @property {string} value The current code string.
 * @property {string} language The programming language (e.g., 'javascript', 'python').
 * @property {(value: string) => void} onChange Callback fired when the code value changes.
 * @property {boolean} [readOnly] Optional: If true, the editor cannot be edited.
 */
interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

/**
 * @function CodeEditor
 * @description A basic code editor component, currently a textarea.
 * Designed to be easily upgraded to Monaco Editor or CodeMirror.
 * @param {CodeEditorProps} props The component props.
 * @returns {JSX.Element} The rendered code editor.
 */
const CodeEditor: React.FC<CodeEditorProps> = ({ value, language, onChange, readOnly = false }) => {
  return (
    <div style={styles.container}>
      <label htmlFor="code-editor" style={styles.label}>Code ({language})</label>
      <textarea
        id="code-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        spellCheck={false}
        style={styles.textarea}
        aria-label={`Code editor for ${language}`}
        placeholder={`Write your ${language} code here...`}
      />
    </div>
  );
};

// Basic inline styles for a clean look. You should replace this with a CSS framework or stylesheet.
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  label: {
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    color: '#333',
    fontWeight: 'bold',
  },
  textarea: {
    width: '100%',
    height: '300px', // Default height
    minHeight: '150px', // Allow vertical resizing
    fontFamily: 'monospace',
    fontSize: 14,
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    backgroundColor: '#f9f9f9',
    color: '#333',
    resize: 'vertical',
    boxSizing: 'border-box', // Include padding and border in the element's total width and height
  },
};

export default CodeEditor;
