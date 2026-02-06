// Test script to understand your content format
const content = `"{\\n  \\"report_meta\\": {\\n    \\"generated_at\\": \\"2026-02-05T12:00:00Z\\",\\n    \\"report_type\\": \\"seo_audit\\",\\n    \\"version\\": \\"1.0\\"\\n  },\\n  \\"executive_summary\\": {\\n    \\"title\\": \\"Executive Summary\\",\\n    \\"html\\": \\"<h2>Executive Summary</h2><p>The landing page for <strong>incorpyfy.com</strong> shows solid business messaging but suffers from critical technical flaws, thin internal linking, and limited content depth. Authority signals are modest (DA 18, PA 35) and the backlink profile is dominated by low‑value directories, creating a short‑term ranking risk. Quick technical fixes combined with a structured content expansion and a disciplined link‑building program will raise relevance, improve user experience, and strengthen trust signals within the next 3‑6 months.</p>\\"\\n  },\\n  \\"authority_and_trust\\": {\\n    \\"title\\": \\"Authority & Trust Signals\\",\\n    \\"html\\": \\"<h2>Authority & Trust Signals</h2><table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody><tr><td>Domain Authority</td><td>18</td></tr><tr><td>Page Authority</td><td>35</td></tr><tr><td>Spam Score</td><td>4 %</td></tr><tr><td>Total Backlinks</td><td>7,386</td></tr></tbody></table><p>The backlink profile is large but low‑quality: most links come from directories and stat sites, with few contextual editorial links. Spam risk is low but could rise if toxic links remain.</p>\\",\\n    \\"metrics\\": {\\n      \\"domain_authority\\": 18,\\n      \\"page_authority\\": 35,\\n      \\"spam_score\\": 4,\\n      \\"backlinks_total\\": 7386\\n    }\\n  }\\n}"`;

console.log('Original content length:', content.length);
console.log('Starts with quote:', content.startsWith('"'));
console.log('Ends with quote:', content.endsWith('"'));

// Try to parse it properly
try {
  // Remove outer quotes
  const withoutOuterQuotes = content.slice(1, -1);
  console.log('Without outer quotes length:', withoutOuterQuotes.length);
  
  // Replace escaped quotes
  const unescaped = withoutOuterQuotes.replace(/\\"/g, '"');
  console.log('Unescaped length:', unescaped.length);
  
  // Try to parse
  const parsed = JSON.parse(unescaped);
  console.log('Successfully parsed!');
  console.log('Keys:', Object.keys(parsed));
  console.log('Report meta exists:', !!parsed.report_meta);
  console.log('Executive summary exists:', !!parsed.executive_summary);
} catch (e) {
  console.error('Parse error:', e.message);
}