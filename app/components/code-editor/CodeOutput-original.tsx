import React from 'react';

interface CodeOutputProps {
  output: any;
  isLoading?: boolean;
}

const CodeOutput: React.FC<CodeOutputProps> = ({ output, isLoading }) => {
  if (isLoading) {
    return <pre>Running code...</pre>;
  }

  if (!output) {
    return null;
  }

  if (output.error) {
    return <pre style={{ color: 'red' }}>{output.error}</pre>;
  }

  return (
    <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: 10, borderRadius: 4 }}>
      {typeof output.stdout === 'string' ? output.stdout : JSON.stringify(output, null, 2)}
    </pre>
  );
};

export default CodeOutput;
