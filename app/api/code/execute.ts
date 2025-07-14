// File: /app/api/code/execute.ts

import { NextRequest, NextResponse } from 'next/server';
// Assuming your code-executor is accessible via this path.
// Adjust the import path if your project structure differs (e.g., '@lib/coding/tools/code-executor').
import { executeCode, streamExecuteCode } from '@/lib/coding/tools/code-executor'; 

/**
 * @function POST
 * @description Handles POST requests for code execution.
 * Supports both standard JSON responses and Server-Sent Events (SSE) for streaming output.
 * @param req The Next.js NextRequest object, containing code and language in its body.
 * @returns A Next.js NextResponse object with execution results or an error, or an SSE stream.
 */
export async function POST(req: NextRequest) {
  // Parse the request body to get code and language.
  const { code, language } = await req.json();

  // Validate required parameters.
  if (!code || typeof code !== 'string' || !language || typeof language !== 'string') {
    return NextResponse.json({ 
      error: 'Invalid request: "code" (string) and "language" (string) are required.' 
    }, { status: 400 });
  }

  // Determine if the client is requesting a streaming response via SSE.
  const isStreamingRequest = req.headers.get('Accept') === 'text/event-stream';

  if (isStreamingRequest) {
    // --- Handle Streaming Code Execution (Server-Sent Events) ---
    // This allows real-time output (stdout, stderr) from long-running code.
    try {
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            // Ensure streamExecuteCode is implemented to yield chunks.
            // If it's not, you'd need to adapt this or handle buffering.
            const stream = streamExecuteCode(code, language); 
            
            for await (const chunk of stream) {
              const eventData = `data: ${JSON.stringify(chunk)}\n\n`;
              controller.enqueue(encoder.encode(eventData));
            }
            controller.close(); // Signal end of stream
          } catch (streamError: any) {
            console.error(`[API/execute] Streaming error: ${streamError.message}`);
            const errorData = `data: ${JSON.stringify({ type: 'error', message: streamError.message })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          }
        },
      });

      // Set headers for Server-Sent Events.
      return new NextResponse(customReadable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
        },
        status: 200,
      });

    } catch (apiStreamError: any) {
      console.error(`[API/execute] Failed to initiate streaming: ${apiStreamError.message}`);
      return NextResponse.json({ 
        error: `Failed to start streaming code execution: ${apiStreamError.message}` 
      }, { status: 500 });
    }

  } else {
    // --- Handle Standard (Non-Streaming) Code Execution ---
    // For quick executions or when streaming isn't desired.
    try {
      const result = await executeCode(code, language); // Assumes executeCode returns a Promise.
      return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
      console.error(`[API/execute] Code execution error: ${error.message}`);
      return NextResponse.json({ 
        error: `Code execution failed: ${error.message}`, 
        details: error.details || null // Include more details if your executeCode provides them.
      }, { status: 500 });
    }
  }
}

// NOTE: For `streamExecuteCode` to work, ensure your `/lib/coding/tools/code-executor.ts`
// implements an `async generator` function. Example:
/*
// In /lib/coding/tools/code-executor.ts
export async function* streamExecuteCode(code: string, language: string): AsyncGenerator<any> {
    // ... setup sandbox, write code to file ...
    const childProcess = spawn(command, args, { cwd: sandboxPath });

    // Yield stdout data as it comes
    for await (const data of childProcess.stdout) {
        yield { type: 'stdout', content: data.toString() };
    }
    // Yield stderr data as it comes
    for await (const data of childProcess.stderr) {
        yield { type: 'stderr', content: data.toString() };
    }

    // Yield final exit code
    const exitCode = await new Promise((resolve) => {
        childProcess.on('close', resolve);
    });
    yield { type: 'exit', code: exitCode };
    // ... cleanup ...
}
*/
