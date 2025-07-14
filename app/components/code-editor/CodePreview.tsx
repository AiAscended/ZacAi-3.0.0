// File: /app/components/code-editor/CodePreview.tsx

import React, { useRef, useEffect } from 'react';

/**
 * @interface CodePreviewProps
 * @description Props for the CodePreview component.
 * @property {string} html The HTML content to render.
 * @property {string} css The CSS content to apply.
 * @property {string} js The JavaScript content to execute.
 */
interface CodePreviewProps {
  html: string;
  css: string;
  js: string;
}

/**
 * @function CodePreview
 * @description Renders HTML, CSS, and JavaScript code within a secure sandboxed iframe.
 * Provides a live, isolated preview environment for web code.
 * @param {CodePreviewProps} props The component props.
 * @returns {JSX.Element} The rendered iframe preview.
 */
const CodePreview: React.FC<CodePreviewProps> = ({ html, css, js }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    // Get the content document of the iframe.
    const doc = iframe.contentDocument || iframe.contentWindow?.document;

    if (!doc) {
      console.warn("Could not access iframe document for preview.");
      return;
    }

    // Construct the full HTML content to be written to the iframe.
    // A Content Security Policy (CSP) is crucial here for security.
    // 'unsafe-inline' is used for simplicity but should be refined for production.
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Code Preview</title>
        <style>${css}</style>
        <meta http-equiv="Content-Security-Policy" content="
          default-src 'self' 'unsafe-inline';
          script-src 'unsafe-inline';
          style-src 'unsafe-inline';
          img-src 'self' data:;
          font-src 'self';
          connect-src 'self';
          frame-src 'self';
        ">
      </head>
      <body>
        ${html}
        <script>
          // Wrap JS in an IIFE to prevent global scope pollution in the parent window.
          (function() {
            try {
              ${js}
            } catch (e) {
              console.error('Error in preview JavaScript:', e);
              // You might want to display this error within the iframe or send it back.
            }
          })();
        </script>
      </body>
      </html>
    `;

    // Write the content to the iframe document.
    doc.open();
    doc.write(content);
    doc.close();

    // Optionally, listen for errors inside the iframe for better debugging.
    iframe.contentWindow?.addEventListener('error', (e) => {
      console.error('Error from iframe:', e.message, e.filename, e.lineno);
    });

  }, [html, css, js]); // Re-run effect if HTML, CSS, or JS changes.

  return (
    <div style={styles.container}>
      <label style={styles.label}>Live Preview</label>
      <iframe
        ref={iframeRef}
        // `sandbox` attribute is critical for security, isolating the iframe from the parent page.
        // `allow-scripts`: allows JS execution.
        // You might need to add `allow-forms`, `allow-popups`, etc. depending on features.
        sandbox="allow-scripts allow-forms allow-modals" 
        style={styles.iframe}
        title="Code Live Preview"
        // Key to ensure iframe content updates properly without full page reload.
        key={Math.random()} 
      />
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
  iframe: {
    width: '100%',
    height: '300px',
    minHeight: '150px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
  },
};

export default CodePreview;
