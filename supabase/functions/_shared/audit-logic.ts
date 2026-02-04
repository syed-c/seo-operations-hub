export interface AuditResult {
    technical_score: number;
    content_score: number;
    seo_score: number;
    issues: string[];
}

export function calculateScores(data: any): AuditResult {
    let technicalScore = 100;
    let contentScore = 100;
    const issues: string[] = [];

    // Technical Checks
    if (!data.title) {
        technicalScore -= 20;
        issues.push('Missing Title Tag');
    } else if (data.title.length < 10 || data.title.length > 70) {
        technicalScore -= 5;
        issues.push('Title length suboptimal');
    }

    if (!data.description) {
        technicalScore -= 10;
        issues.push('Missing Meta Description');
    }

    // Content Checks
    if (!data.h1) {
        contentScore -= 20;
        issues.push('Missing H1 Heading');
    }

    if (data.wordCount < 300) {
        contentScore -= 20;
        issues.push('Thin content (< 300 words)');
    }

    if (data.links.internal === 0) {
        contentScore -= 10;
        issues.push('No internal links found');
    }

    // Clamping
    technicalScore = Math.max(0, technicalScore);
    contentScore = Math.max(0, contentScore);
    const seoScore = Math.round((technicalScore + contentScore) / 2);

    return {
        technical_score: technicalScore,
        content_score: contentScore,
        seo_score: seoScore,
        issues
    };
}
