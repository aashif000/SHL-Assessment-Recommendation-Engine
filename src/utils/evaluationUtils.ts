
import { Assessment, EvaluationResult, TestQuery } from "@/types";
import { getRecommendations } from "./recommendationEngine";
import { testQueries } from "@/data/testQueries";

// Calculate Recall@K for a single query
const calculateRecallAtK = (
  recommendations: Assessment[],
  relevantAssessmentNames: string[],
  k: number
): number => {
  // Get the top K recommendations
  const topK = recommendations.slice(0, k);
  
  // Count how many of the top K are relevant
  const relevantFound = topK.filter(rec => 
    relevantAssessmentNames.includes(rec.name)
  ).length;
  
  // Calculate recall
  const recall = relevantAssessmentNames.length > 0 
    ? relevantFound / relevantAssessmentNames.length
    : 0;
    
  return recall;
};

// Calculate Average Precision@K for a single query
const calculateAPAtK = (
  recommendations: Assessment[],
  relevantAssessmentNames: string[],
  k: number
): number => {
  // Get the top K recommendations
  const topK = recommendations.slice(0, k);
  
  let sum = 0;
  let relevantCount = 0;
  
  // Calculate precision@i for each relevant item in the top K
  for (let i = 0; i < topK.length; i++) {
    const isRelevant = relevantAssessmentNames.includes(topK[i].name);
    
    if (isRelevant) {
      relevantCount++;
      // Precision at position i+1
      const precisionAtI = relevantCount / (i + 1);
      sum += precisionAtI;
    }
  }
  
  // Calculate AP
  const ap = relevantAssessmentNames.length > 0
    ? sum / Math.min(k, relevantAssessmentNames.length)
    : 0;
    
  return ap;
};

// Evaluate the model on the test queries
export const evaluateModel = async (k = 3): Promise<EvaluationResult> => {
  let totalRecall = 0;
  let totalAP = 0;
  
  // Evaluate each test query
  for (const testQuery of testQueries) {
    // Get recommendations (now need to await the Promise)
    const recommendationsResponse = await getRecommendations(testQuery.query, 10);
    const recommendations = recommendationsResponse.assessments;
    
    // Calculate Recall@K
    const recallAtK = calculateRecallAtK(
      recommendations,
      testQuery.relevantAssessments,
      k
    );
    totalRecall += recallAtK;
    
    // Calculate AP@K
    const apAtK = calculateAPAtK(
      recommendations,
      testQuery.relevantAssessments,
      k
    );
    totalAP += apAtK;
  }
  
  // Calculate Mean Recall@K and MAP@K
  const meanRecallAtK = totalRecall / testQueries.length;
  const mapAtK = totalAP / testQueries.length;
  
  return {
    meanRecallAt3: meanRecallAtK,
    mapAt3: mapAtK,
    totalQueries: testQueries.length
  };
};
