import React, { useRef, useEffect } from 'react';

interface SandboxFrameProps {
  html: string;
  css: string;
  js: string;
}

export const SandboxFrame: React.FC<SandboxFrameProps> = ({ html, css, js }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    if (!iframeRef.current) return;
    
    // Create a secure sandbox environment
    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (!iframeDoc) return;
    
    // Create a secure HTML template with CSP headers
    const secureHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline';">
          <style>${css}</style>
        </head>
        <body>
          ${html}
          <script>${js}</script>
        </body>
      </html>
    `;
    
    iframeDoc.open();
    iframeDoc.write(secureHTML);
    iframeDoc.close();
  }, [html, css, js]);
  
  return (
    <iframe 
      ref={iframeRef}
      sandbox="allow-scripts"
      className="w-full h-full border-0"
      title="Code Preview"
    />
  );
};
