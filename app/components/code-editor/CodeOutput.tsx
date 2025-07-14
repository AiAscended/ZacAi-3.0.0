// File: /app/components/code-editor/CodeOutput.tsx

import React from 'react';

/**
 * @interface CodeOutputProps
 * @description Props for the CodeOutput component.
 * @property {any} output The output data from the code execution (can be string, object, or error).
 * @property {boolean} [isLoading] Optional: If true, indicates that code is currently executing.
 */
interface CodeOutputProps {
  output: any;
  isLoading?: boolean;
}

/**
 * @function CodeOutput
 * @description Displays the output from code execution, including standard output, errors, or loading states.
 * @param {CodeOutputProps} props The component props.
 * @returns {JSX.Element | null} The rendered output block or null if no output/loading.
 */
const CodeOutput: React.FC<CodeOutputProps> = ({ output, isLoading }) => {
  if (isLoading) {
    return (
      <div style={styles.container}>
        <label style={styles.label}>Output</label>
        <pre style={{ ...styles.pre, color: '#007bff' }}>Executing code... Please wait.</pre>
      </div>
    );
  }

  if (!output) {
    return null; // No output to display yet.
  }

  // Handle error output from the backend.
  if (output.error) {
    return (
      <div style={styles.container}>
        <label style={styles.label}>Output (Error)</label>
        <pre style={{ ...styles.pre, color: 'red', borderColor: 'red' }}>
          Error: {output.error}
          {output.details && `\nDetails: ${JSON.stringify(output.details, null, 2)}`}
        </pre>
      </div>
    );
  }

  // Handle standard output (stdout, stderr, and exit code for streaming).
  let displayedOutput = '';
  if (typeof output.stdout === 'string') {
    displayedOutput += `STDOUT:\n${output.stdout}\n`;
  }
  if (typeof output.stderr === 'string' && output.stderr) {
    displayedOutput += `STDERR:\n${output.stderr}\n`;
  }
  if (typeof output.code === 'number') { // Exit code for non-streaming or final streaming event.
    displayedOutput += `\nProcess exited with code: ${output.code}`;
  }
  // Fallback for any other structure of output.
  if (!displayedOutput && output) {
    displayedOutput = JSON.stringify(output, null, 2);
  }

  return (
    <div style={styles.container}>
      <label style={styles.label}>Output</label>
      <pre style={styles.pre}>{displayedOutput || 'No output.'}</pre>
    </div>
  );
};

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
  pre: {
    whiteSpace: 'pre-wrap', // Preserve whitespace and wrap lines
    wordBreak: 'break-word', // Break long words
    backgroundColor: '#f5f5f5',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    color: '#333',
    minHeight: '100px', // Ensure visibility even with no output
    overflow: 'auto', // For long outputs
    fontFamily: 'monospace',
    fontSize: 14,
  },
};

export default CodeOutput;
