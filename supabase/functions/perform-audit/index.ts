import { createClient } from "@supabase/supabase-js";
import { fetchWithTimeout, parseSitemap, extractPageContent } from "../_shared/scraping-utils.ts";
import { calculateScores } from "../_shared/audit-logic.ts";
import { serveWithNotification } from "../_shared/wrapper.ts";
import { jobManager } from "../_shared/job-manager.ts";

const MAX_PAGES_PER_RUN = 10;
const TIME_BUDGET_MS = 45000; // 45 seconds to stay safe from Edge limits

serveWithNotification('perform-audit', async (req) => {
    const startTime = Date.now();
    const supabaseClient = createClient(
        Deno.env.get('VITE_SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { project_id, url, job_id } = body;

    // Use job_id if provided, otherwise this might be a legacy call or direct trigger
    // For production hardening, we prefer job_id.
    if (!job_id) {
        // Fallback: Create a job if not provided? Or just run in legacy mode.
        // Let's assume for now we want to stick to the new system.
        throw new Error("Missing job_id. All audits must be stateful.");
    }

    const job = await jobManager.getJob(job_id);
    const cursor = job.job_state?.cursor || { urls: [], currentIndex: 0, sitemapFetched: false };

    await jobManager.updateStatus(job_id, 'processing');
    await jobManager.log(job_id, 'perform-audit', 'info', `Starting audit run. Progress: ${cursor.currentIndex}`);

    let urlsToProcess = cursor.urls || [];

    // 1. Fetch Sitemap if not already done
    if (!cursor.sitemapFetched) {
        try {
            const sitemapUrl = url.endsWith('/') ? `${url}sitemap.xml` : `${url}/sitemap.xml`;
            const sitemapRes = await fetchWithTimeout(sitemapUrl);
            if (sitemapRes.ok) {
                const xml = await sitemapRes.text();
                urlsToProcess = await parseSitemap(xml);
                await jobManager.log(job_id, 'perform-audit', 'info', `Sitemap found: ${urlsToProcess.length} URLs.`);
            } else {
                urlsToProcess = [url];
                await jobManager.log(job_id, 'perform-audit', 'warn', `Sitemap not found, falling back to: ${url}`);
            }
        } catch (err) {
            urlsToProcess = [url];
            await jobManager.log(job_id, 'perform-audit', 'error', `Sitemap error: ${err.message}`);
        }
        cursor.urls = urlsToProcess;
        cursor.sitemapFetched = true;
    }

    let processedThisRun = 0;

    // 2. Process Batch
    for (let i = cursor.currentIndex; i < urlsToProcess.length; i++) {
        // Guard 1: Max pages per run
        if (processedThisRun >= MAX_PAGES_PER_RUN) {
            await jobManager.log(job_id, 'perform-audit', 'info', `Max pages per run reached (${MAX_PAGES_PER_RUN}). Saving state.`);
            cursor.currentIndex = i;
            await jobManager.updateState(job_id, cursor, { processed: i, total: urlsToProcess.length });
            await jobManager.updateStatus(job_id, 'partial');
            return { status: "partial", next_index: i, message: "Reached batch limit" };
        }

        // Guard 2: Time budget
        if (Date.now() - startTime > TIME_BUDGET_MS) {
            await jobManager.log(job_id, 'perform-audit', 'info', `Time budget exceeded (${TIME_BUDGET_MS}ms). Saving state.`);
            cursor.currentIndex = i;
            await jobManager.updateState(job_id, cursor, { processed: i, total: urlsToProcess.length });
            await jobManager.updateStatus(job_id, 'partial');
            return { status: "partial", next_index: i, message: "Reached time limit" };
        }

        const pageUrl = urlsToProcess[i];
        try {
            const htmlRes = await fetchWithTimeout(pageUrl);
            if (htmlRes.ok) {
                const html = await htmlRes.text();
                const data = extractPageContent(html);
                if (data) {
                    const scores = calculateScores(data);

                    await supabaseClient.from('pages').upsert({
                        project_id,
                        url: pageUrl,
                        title: data.title,
                        meta_description: data.description,
                        h1: data.h1,
                        word_count: data.wordCount,
                        technical_score: scores.technical_score,
                        content_score: scores.content_score,
                        seo_score: scores.seo_score,
                        ai_status: 'pending',
                        on_page_data: data,
                        last_audited: new Date().toISOString()
                    }, { onConflict: 'project_id, url' });
                }
            }
        } catch (err) {
            await jobManager.log(job_id, 'perform-audit', 'error', `Failed to audit ${pageUrl}: ${err.message}`);
        }

        processedThisRun++;
    }

    // 3. Finalize
    await jobManager.updateStatus(job_id, 'completed');
    await jobManager.updateState(job_id, { ...cursor, currentIndex: urlsToProcess.length }, { processed: urlsToProcess.length, total: urlsToProcess.length });

    // Trigger Async AI Processing and Report Generation
    const functionsUrl = `${Deno.env.get('VITE_SUPABASE_URL')}/functions/v1`;

    // Trigger AI
    fetch(`${functionsUrl}/process-ai`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ project_id, job_id })
    }).catch(err => console.error("Failed to trigger process-ai:", err));

    // Trigger Report
    fetch(`${functionsUrl}/generate-report`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ project_id })
    }).catch(err => console.error("Failed to trigger report generation:", err));

    return { success: true, processed: urlsToProcess.length, status: "completed" };
});


