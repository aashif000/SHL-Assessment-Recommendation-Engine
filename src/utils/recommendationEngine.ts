
import { assessments } from "@/data/assessments";
import { Assessment, GeminiSettings, RagSettings, RecommendationSource } from "@/types";
import { useGeminiRecommendations, useRagRecommendations } from "./geminiUtils";

// Enhanced matching score function based on term frequency and context
const calculateMatchScore = (query: string, assessment: Assessment): number => {
  const queryLower = query.toLowerCase();
  const assessmentNameLower = assessment.name.toLowerCase();
  const assessmentTypeLower = assessment.testType.toLowerCase();
  
  // Extract key terms from the query
  const queryTerms = queryLower.split(/\s+/);
  
  // Specific duration match (if mentioned in the query)
  const durationMatch = queryLower.includes(assessment.duration.toLowerCase()) ? 5 : 0;
  
  // Duration constraints check (e.g., "less than 30 minutes", "within 45 mins")
  let durationConstraintMatch = 0;
  const assessmentDurationMinutes = parseInt(assessment.duration);
  
  if (
    (queryLower.includes("less than") || queryLower.includes("within") || queryLower.includes("under") || 
     queryLower.includes("max") || queryLower.includes("at most")) &&
    !isNaN(assessmentDurationMinutes)
  ) {
    // Extract the requested max duration from the query
    const durationRegex = /(?:less than|within|under|max|maximum|at most)\s+(\d+)\s*(?:min|minutes|mins)/i;
    const match = queryLower.match(durationRegex);
    
    if (match && match[1]) {
      const requestedMaxDuration = parseInt(match[1]);
      if (assessmentDurationMinutes <= requestedMaxDuration) {
        durationConstraintMatch = 3;
      } else {
        // Severe penalty for exceeding requested max duration
        durationConstraintMatch = -10;
      }
    }
  }
  
  // Check for specific timeframe mentions like "30-40 mins"
  const timeRangeRegex = /(\d+)(?:\s*-\s*|\s+to\s+)(\d+)\s*(?:min|minutes|mins)/i;
  const timeRangeMatch = queryLower.match(timeRangeRegex);
  if (timeRangeMatch && timeRangeMatch[1] && timeRangeMatch[2]) {
    const minRange = parseInt(timeRangeMatch[1]);
    const maxRange = parseInt(timeRangeMatch[2]);
    
    if (
      !isNaN(assessmentDurationMinutes) && 
      assessmentDurationMinutes >= minRange && 
      assessmentDurationMinutes <= maxRange
    ) {
      durationConstraintMatch = 4;
    }
  }
  
  // Calculate term matching score
  let termMatchScore = 0;
  for (const term of queryTerms) {
    if (term.length <= 2) continue; // Skip very short terms
    
    // Boost score for exact matches in name or test type
    if (assessmentNameLower.includes(term)) {
      termMatchScore += 2;
    }
    if (assessmentTypeLower.includes(term)) {
      termMatchScore += 3;
    }
    
    // Technical skill matching with enhanced weighting
    const technicalSkills = {
      'java': ['java'],
      'javascript': ['javascript', 'js'],
      'python': ['python'],
      'sql': ['sql', 'database'],
      'html': ['html', 'html5'],
      'css': ['css', 'css3'],
      'selenium': ['selenium', 'testing'],
      'qa': ['qa', 'test', 'testing', 'quality']
    };
    
    Object.entries(technicalSkills).forEach(([skill, terms]) => {
      if (terms.some(t => term === t) && 
          (assessmentNameLower.includes(skill) || assessmentTypeLower.includes('technical'))) {
        termMatchScore += 5;
      }
    });
    
    // Role-specific matching
    const roles = {
      'sales': ['sales', 'selling', 'service'],
      'admin': ['admin', 'administrative', 'administration'],
      'qa': ['qa', 'quality', 'tester', 'testing'],
      'language': ['english', 'language', 'communication'],
      'marketing': ['seo', 'marketing', 'content']
    };
    
    Object.entries(roles).forEach(([role, terms]) => {
      if (terms.some(t => term === t) && 
          (assessmentNameLower.includes(role) || assessmentTypeLower.includes(role))) {
        termMatchScore += 5;
      }
    });
  }
  
  // Role specific bonuses with more roles considered
  const roleMatches = [
    { query: 'developer', type: 'technical', score: 3 },
    { query: 'admin', type: 'administrative', score: 3 },
    { query: 'sales', type: 'sales', score: 3 },
    { query: 'manager', type: 'comprehensive', score: 3 },
    { query: 'writer', type: 'content', score: 3 },
    { query: 'analyst', type: 'cognitive', score: 3 },
    { query: 'tester', type: 'qa', score: 3 },
  ];
  
  for (const match of roleMatches) {
    if (queryLower.includes(match.query) && assessmentTypeLower.includes(match.type)) {
      termMatchScore += match.score;
    }
  }
  
  // Check for long-form job descriptions
  if (query.length > 500) {
    // This is likely a job description, look for key skills more thoroughly
    const languages = ['java', 'javascript', 'python', 'sql', 'html', 'css'];
    const frameworks = ['react', 'angular', 'vue', 'node', 'express', 'django', 'flask'];
    const roles = ['developer', 'engineer', 'manager', 'analyst', 'admin', 'assistant', 'tester', 'qa'];
    
    for (const lang of languages) {
      if (queryLower.includes(lang) && assessmentNameLower.includes(lang)) {
        termMatchScore += 4; // Higher weight for skills in job descriptions
      }
    }
    
    for (const framework of frameworks) {
      if (queryLower.includes(framework) && 
          (assessmentNameLower.includes(framework) || assessmentTypeLower.includes('technical'))) {
        termMatchScore += 3;
      }
    }
    
    for (const role of roles) {
      if (queryLower.includes(role) && 
          (assessmentNameLower.includes(role) || assessmentTypeLower.includes(role))) {
        termMatchScore += 3;
      }
    }
  }
  
  // Final score combines all factors
  const finalScore = termMatchScore + durationMatch + durationConstraintMatch;
  
  return finalScore;
};

export const getRecommendations = async (
  query: string,
  maxResults = 10,
  geminiSettings?: GeminiSettings,
  ragSettings?: RagSettings
): Promise<{ assessments: Assessment[], source: RecommendationSource }> => {
  // Try RAG if enabled and API key is provided
  if (ragSettings?.enabled && ragSettings?.apiKey && ragSettings?.endpoint) {
    try {
      // Get recommendations from RAG
      const ragResults = await useRagRecommendations(query, ragSettings, maxResults);
      
      // If RAG returned results, use them
      if (ragResults && ragResults.length > 0) {
        return {
          assessments: ragResults,
          source: { type: "rag", name: "RAG System" }
        };
      }
    } catch (error) {
      console.error("RAG recommendations failed:", error);
      // Fall back to Gemini or rule-based approach
    }
  }

  // Try Gemini if enabled and API key is provided
  if (geminiSettings?.enabled && geminiSettings?.apiKey) {
    try {
      // Get recommendations from Gemini
      const geminiResults = await useGeminiRecommendations(query, geminiSettings.apiKey, maxResults);
      
      // If Gemini returned results, use them
      if (geminiResults && geminiResults.length > 0) {
        return {
          assessments: geminiResults,
          source: { type: "gemini", name: "Gemini AI" }
        };
      }
    } catch (error) {
      console.error("Gemini recommendations failed:", error);
      // Fall back to rule-based approach
    }
  }
  
  // Rule-based approach (fallback)
  // Calculate scores for each assessment
  const scoredAssessments = assessments.map(assessment => ({
    assessment,
    score: calculateMatchScore(query, assessment)
  }));
  
  // Sort by score (descending)
  scoredAssessments.sort((a, b) => b.score - a.score);
  
  // Return top N results, but at least 1
  const topResults = scoredAssessments
    .slice(0, Math.max(1, maxResults))
    .map(item => item.assessment);
  
  return {
    assessments: topResults,
    source: { type: "rule-based", name: "Rule-Based Engine" }
  };
};

// New function to expose API endpoint for recommendations
export const createApiResponse = async (
  query: string, 
  geminiSettings?: GeminiSettings,
  ragSettings?: RagSettings
) => {
  const { assessments: recommendations } = await getRecommendations(query, 10, geminiSettings, ragSettings);
  
  return {
    recommendations: recommendations.map(assessment => ({
      name: assessment.name.replace(" | SHL", ""),
      url: assessment.url,
      remoteTestingSupport: assessment.remoteTestingSupport,
      adaptiveIRTSupport: assessment.adaptiveIRTSupport,
      duration: assessment.duration,
      testType: assessment.testType
    })),
    query
  };
};
