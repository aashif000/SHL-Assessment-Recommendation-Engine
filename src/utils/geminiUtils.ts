
import { Assessment } from "@/types";
import { toast } from "sonner";
import { assessments } from "@/data/assessments";

export const useGeminiRecommendations = async (
  query: string,
  apiKey: string,
  maxResults = 10
): Promise<Assessment[]> => {
  try {
    // Construct the prompt for Gemini
    const prompt = `
You are an expert AI assistant specializing in SHL assessment tests for hiring.

Given the following job description or query:
"${query}"

Please recommend the most relevant SHL assessments from the catalog. Follow these specific guidelines:
1. Consider any duration constraints mentioned in the query (e.g., "less than 30 minutes", "within 45 mins").
2. Focus on technical skills, job roles, and other requirements mentioned.
3. Pay special attention to any specific technical skills (Java, Python, JavaScript, etc.) mentioned.
4. Consider administrative, sales, or other specialized roles mentioned.

Return your response as JSON with the following format:
{
  "recommendations": ["Assessment Name 1 | SHL", "Assessment Name 2 | SHL", "Assessment Name 3 | SHL"]
}

Only return assessment names that are likely to be in the SHL catalog and relevant to the query. Include no more than 10 assessments and rank them by relevance to the query.
`;

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract the text response from Gemini
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error("No response from Gemini API");
    }
    
    // Extract the JSON part of the response
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from Gemini response");
    }
    
    const jsonResponse = JSON.parse(jsonMatch[0]);
    const recommendedAssessmentNames = jsonResponse.recommendations || [];
    
    // Map the assessment names to actual assessment objects
    const recommendedAssessments = assessments.filter(assessment => 
      recommendedAssessmentNames.includes(assessment.name)
    );
    
    // If we couldn't find exact matches, try partial matches
    if (recommendedAssessments.length === 0) {
      const partialMatches = recommendedAssessmentNames.flatMap(recommendedName => {
        // Remove "| SHL" suffix for matching if present
        const cleanName = recommendedName.replace(" | SHL", "").trim();
        
        return assessments.filter(assessment => 
          assessment.name.toLowerCase().includes(cleanName.toLowerCase())
        );
      });
      
      // Remove duplicates
      return Array.from(new Set(partialMatches.map(a => a.name)))
        .map(name => partialMatches.find(a => a.name === name))
        .filter(Boolean) as Assessment[];
    }
    
    return recommendedAssessments.slice(0, maxResults);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    toast.error("Failed to get recommendations from Gemini. Using rule-based system instead.");
    return [];
  }
};

// New function to use the RAG system if available
export const useRagRecommendations = async (
  query: string, 
  ragSettings: { apiKey: string, endpoint: string },
  maxResults = 10
): Promise<Assessment[]> => {
  try {
    // Call the Python RAG API endpoint
    const response = await fetch(ragSettings.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ragSettings.apiKey}`
      },
      body: JSON.stringify({
        query,
        maxResults
      })
    });

    if (!response.ok) {
      throw new Error(`RAG API error: ${response.status}`);
    }

    const data = await response.json();
    
    // The RAG API should return assessment names
    // We need to map them to the actual assessment objects
    const recommendedAssessmentNames = data.recommendations || [];
    
    // Map the assessment names to our local assessment objects
    const recommendedAssessments = assessments.filter(assessment =>
      recommendedAssessmentNames.some(recName => 
        assessment.name.includes(recName) || recName.includes(assessment.name.replace(' | SHL', ''))
      )
    );
    
    return recommendedAssessments.slice(0, maxResults);
  } catch (error) {
    console.error("Error calling RAG API:", error);
    toast.error("Failed to get recommendations from RAG system. Using alternative method.");
    return [];
  }
};
