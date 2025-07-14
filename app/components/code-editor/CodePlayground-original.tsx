import React, { useState } from 'react';
import CodeEditor from './CodeEditor';
import CodePreview from './CodePreview';
import CodeOutput from './CodeOutput';

interface CodePlaygroundProps {
  initialCode?: string;
  language?: string;
}

const CodePlayground: React.FC<CodePlaygroundProps> = ({ initialCode = '', language = 'javascript' }) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runCode = async () => {
    setIsRunning(true);
    setOutput(null);
    try {
      const res = await fetch('/api/code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });
      const result = await res.json();
      setOutput(result);
    } catch (error: any) {
      setOutput({ error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
      <CodeEditor value={code} onChange={setCode} language={language} />
      <button onClick={runCode} disabled={isRunning} style={{ padding: '0.5rem 1rem' }}>
        {isRunning ? 'Running...' : 'Run Code'}
      </button>
      {['html', 'css', 'javascript'].includes(language) ? (
        <CodePreview html={language === 'html' ? code : ''} css={language === 'css' ? code : ''} js={language === 'javascript' ? code : ''} />
      ) : (
        <CodeOutput output={output} isLoading={isRunning} />
      )}
    </div>
  );
};

export default CodePlayground;
