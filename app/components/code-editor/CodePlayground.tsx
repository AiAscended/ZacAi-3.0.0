// File: /app/components/code-editor/CodePlayground.tsx

import React, { useState, useEffect, useCallback } from 'react';
import CodeEditor from './CodeEditor';
import CodePreview from './CodePreview';
import CodeOutput from './CodeOutput';

/**
 * @interface CodePlaygroundProps
 * @description Props for the CodePlayground component.
 * @property {string} [initialCode] Optional: The initial code to display in the editor.
 * @property {string} [language] Optional: The initial programming language (e.g., 'javascript', 'python').
 * @property {boolean} [enableStreaming] Optional: If true, attempts to stream execution output.
 */
interface CodePlaygroundProps {
  initialCode?: string;
  language?: string;
  enableStreaming?: boolean;
}

/**
 * @function CodePlayground
 * @description A comprehensive component that combines a code editor,
 * a live preview (for web languages) or an output console (for other languages),
 * and functionality to execute code via a backend API.
 * @param {CodePlaygroundProps} props The component props.
 * @returns {JSX.Element} The rendered code playground.
 */
const CodePlayground: React.FC<CodePlaygroundProps> = ({ 
  initialCode = 'console.log("Hello, World!");', 
  language = 'javascript',
  enableStreaming = false, // Default to false for simplicity, can be set to true.
}) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(language);

  // Determine if the current language is a web language that can be previewed.
  const isWebLanguage = useCallback((lang: string) => {
    return ['html', 'css', 'javascript'].includes(lang.toLowerCase());
  }, []);

  const runCode = async () => {
    setIsRunning(true);
    setOutput(null); // Clear previous output

    try {
      if (enableStreaming) {
        // --- Streaming Execution ---
        const eventSource = new EventSource('/api/code/execute'); // Uses SSE
        let fullOutput: { stdout: string, stderr: string, code?: number } = { stdout: '', stderr: '' };

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'stdout') {
            fullOutput.stdout += data.content;
          } else if (data.type === 'stderr') {
            fullOutput.stderr += data.content;
          } else if (data.type === 'exit') {
            fullOutput.code = data.code;
            setOutput(fullOutput);
            eventSource.close();
            setIsRunning(false);
          } else if (data.type === 'error') {
            setOutput({ error: data.message });
            eventSource.close();
            setIsRunning(false);
          }
          // Update output state frequently for real-time display
          setOutput({ ...fullOutput });
        };

        eventSource.onerror = (err) => {
          console.error('EventSource failed:', err);
          setOutput({ error: 'Connection to streaming service failed.' });
          setIsRunning(false);
          eventSource.close();
        };

        // Send the initial request to start streaming on the server.
        // NOTE: This part needs careful handling. EventSource typically opens a connection,
        // and you need to send the POST data separately or include it in the URL (less secure).
        // For simple POST with SSE, a regular fetch followed by EventSource can be tricky.
        // A more robust solution might use WebSockets or manage the EventSource stream state on server side after POST.
        // For this example, we assume the server initiates SSE *after* receiving a POST.
        // You might need a separate API endpoint for stream initiation if POST body is complex.
        const res = await fetch('/api/code/execute', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream' // Indicate client desires SSE
            },
            body: JSON.stringify({ code, language: currentLanguage }),
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to start streaming execution');
        }

      } else {
        // --- Non-Streaming Execution ---
        const res = await fetch('/api/code/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, language: currentLanguage }),
        });
        const result = await res.json();
        setOutput(result);
        setIsRunning(false);
      }
    } catch (error: any) {
      setOutput({ error: error.message });
      setIsRunning(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Code Playground</h1>
        <select 
          value={currentLanguage} 
          onChange={(e) => setCurrentLanguage(e.target.value)}
          style={styles.languageSelector}
          aria-label="Select programming language"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          {/* Add more languages as supported by your code-executor */}
        </select>
      </div>

      <div style={styles.editorPreviewContainer}>
        <CodeEditor 
          value={code} 
          onChange={setCode} 
          language={currentLanguage} 
          readOnly={isRunning} // Prevent editing while running
        />
        {isWebLanguage(currentLanguage) ? (
          <CodePreview 
            html={currentLanguage === 'html' ? code : ''} 
            css={currentLanguage === 'css' ? code : ''} 
            js={currentLanguage === 'javascript' ? code : ''} 
          />
        ) : (
          <CodeOutput output={output} isLoading={isRunning} />
        )}
      </div>

      <button 
        onClick={runCode} 
        disabled={isRunning} 
        style={styles.runButton}
      >
        {isRunning ? 'Executing...' : 'Run Code'}
      </button>

      {!isWebLanguage(currentLanguage) && !output && !isRunning && (
        <div style={styles.instructions}>
          <p>Write your {currentLanguage} code above and click "Run Code" to see the output here.</p>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    padding: '20px',
    backgroundColor: '#f0f2f5',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    maxWidth: '1200px',
    margin: '20px auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  languageSelector: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    fontSize: '1rem',
  },
  editorPreviewContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr', // Two columns
    gap: '1.5rem',
    width: '100%',
  },
  runButton: {
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    alignSelf: 'flex-end', // Align button to the right
  },
  runButtonHover: { // Example for hover state (needs JS for implementation)
    backgroundColor: '#0056b3',
  },
  instructions: {
    backgroundColor: '#e6f7ff',
    borderLeft: '4px solid #91d5ff',
    padding: '10px 15px',
    borderRadius: '4px',
    color: '#333',
    fontSize: '0.9rem',
  }
};

export default CodePlayground;
