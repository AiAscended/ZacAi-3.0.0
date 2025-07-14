import React from 'react';

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, language, onChange }) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      style={{
        width: '100%',
        height: '300px',
        fontFamily: 'monospace',
        fontSize: 14,
        padding: 10,
        borderRadius: 4,
        border: '1px solid #ccc',
        resize: 'vertical',
      }}
      aria-label={`Code editor for ${language}`}
    />
  );
};

export default CodeEditor;
