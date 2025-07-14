import React, { useRef, useEffect } from 'react';

interface CodePreviewProps {
  html: string;
  css: string;
  js: string;
}

const CodePreview: React.FC<CodePreviewProps> = ({ html, css, js }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;

    if (!doc) return;

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${css}</style>
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline';">
      </head>
      <body>
        ${html}
        <script>${js}</script>
      </body>
      </html>
    `;

    doc.open();
    doc.write(content);
    doc.close();
  }, [html, css, js]);

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-scripts"
      style={{ width: '100%', height: '300px', border: '1px solid #ccc', borderRadius: 4 }}
      title="Code Preview"
    />
  );
};

export default CodePreview;
