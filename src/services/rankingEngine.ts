// src/services/rankingEngine.ts
import { type ExtractedVideo } from './youtubeScraper';

// Utility to parse views like "1.5M views" to 1500000
function parseViews(viewString: string): number {
  const numStr = viewString.replace(/[^0-9.]/g, '');
  let multiplier = 1;
  if (viewString.toUpperCase().includes('K')) multiplier = 1000;
  if (viewString.toUpperCase().includes('M')) multiplier = 1000000;
  if (viewString.toUpperCase().includes('B')) multiplier = 1000000000;
  return Number(numStr) * multiplier || 0;
}

// Utility to parse "2 days ago", "1 month ago" into approximate days
function parseDaysOld(dateString: string): number {
  const str = dateString.toLowerCase();
  const num = parseInt(str.replace(/[^0-9]/g, '')) || 1;
  
  if (str.includes('hour') || str.includes('minute') || str.includes('now')) return 0.5;
  if (str.includes('day')) return num;
  if (str.includes('week')) return num * 7;
  if (str.includes('month')) return num * 30;
  if (str.includes('year')) return num * 365;
  return 30; // Default fallback
}

export interface RankedVideo extends ExtractedVideo {
  score: number;
}

export function processVideoResults(
  seedKeyword: string,
  expandedKeywords: string[],
  rawVideoArrays: ExtractedVideo[][]
): RankedVideo[] {
  
  // Phase 5: Merge Results
  const allVideos = rawVideoArrays.flat();

  // Phase 6: Duplicate Removal
  const uniqueMap = new Map<string, ExtractedVideo>();
  allVideos.forEach(v => {
    if (!uniqueMap.has(v.video_id)) uniqueMap.set(v.video_id, v);
  });
  const uniqueVideos = Array.from(uniqueMap.values());

  // Phase 7: Relevance Filtering (Must contain seed or an expanded keyword)
  const allowedTerms = [seedKeyword, ...expandedKeywords].map(k => k.toLowerCase());
  const filteredVideos = uniqueVideos.filter(v => {
    const textToSearch = `${v.title} ${v.description} ${v.channel_name}`.toLowerCase();
    return allowedTerms.some(term => textToSearch.includes(term));
  });

  // Calculate global max values for normalizing scores to 0-100
  let maxViews = 1;
  let maxVelocity = 1;

  const preScored = filteredVideos.map(v => {
    const views = parseViews(v.view_count);
    const daysOld = parseDaysOld(v.upload_date);
    const velocity = views / daysOld;

    if (views > maxViews) maxViews = views;
    if (velocity > maxVelocity) maxVelocity = velocity;

    return { ...v, rawViews: views, daysOld, rawVelocity: velocity };
  });

  // Phases 8 & 9: Score Calculation & Final Ranking Formula
  const rankedVideos: RankedVideo[] = preScored.map(v => {
    // 1. Relevance Score (0-100)
    let relevanceScore = 0;
    const titleLower = v.title.toLowerCase();
    if (titleLower.includes(seedKeyword.toLowerCase())) relevanceScore = 100;
    else if (allowedTerms.some(term => titleLower.includes(term))) relevanceScore = 70;
    else relevanceScore = 30;

    // 2. Popularity Score (0-100)
    const popularityScore = (v.rawViews / maxViews) * 100;

    // 3. Velocity Score (0-100)
    const velocityScore = (v.rawVelocity / maxVelocity) * 100;

    // 4. Freshness Score (0-100) - Newer is closer to 100
    let freshnessScore = 100 - (v.daysOld / 365) * 100;
    if (freshnessScore < 0) freshnessScore = 0;

    // The Formula: 40% Rel, 30% Vel, 20% Views, 10% Fresh
    const finalScore = 
      (relevanceScore * 0.40) + 
      (velocityScore * 0.30) + 
      (popularityScore * 0.20) + 
      (freshnessScore * 0.10);

    return {
      ...v,
      score: Number(finalScore.toFixed(2))
    };
  });

  // Phase 10: Sort Results (Highest score first)
  rankedVideos.sort((a, b) => b.score - a.score);

  // Phase 11: Package Data is done (Returns RankedVideo array)
  return rankedVideos;
}
