
import { mailer } from "./smtp-client.ts";
import { serve } from "http/server.ts";

export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function serveWithNotification(
    functionName: string,
    handler: (req: Request) => Promise<any>
) {
    serve(async (req) => {
        console.log(`${functionName}: ${req.method} request received`);
        
        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
            console.log(`${functionName}: Handling OPTIONS request`);
            return new Response('ok', { 
                headers: {
                    ...corsHeaders,
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Max-Age': '86400',
                }
            });
        }

        try {
            const result = await handler(req);
            console.log(`${functionName}: Handler completed successfully`);

            // Send success email (async, don't block response)
            // Note: In some edge environments, background tasks must be explicitly waited on or use EdgeRuntime.waitUntil
            // We will try standard async first.
            if (globalThis.EdgeRuntime && globalThis.EdgeRuntime.waitUntil) {
                globalThis.EdgeRuntime.waitUntil(mailer.sendSuccess(functionName, result));
            } else {
                mailer.sendSuccess(functionName, result).catch(e => console.error("Email error:", e));
            }

            return new Response(JSON.stringify(result), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });

        } catch (error) {
            console.error(`Error in ${functionName}:`, error);

            if (globalThis.EdgeRuntime && globalThis.EdgeRuntime.waitUntil) {
                globalThis.EdgeRuntime.waitUntil(mailer.sendError(functionName, error));
            } else {
                mailer.sendError(functionName, error).catch(e => console.error("Email error:", e));
            }

            return new Response(JSON.stringify({ error: error.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            });
        }
    });
}
