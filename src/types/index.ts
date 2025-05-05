
export interface Assessment {
  name: string;
  url: string;
  remoteTestingSupport: boolean;
  adaptiveIRTSupport: boolean;
  duration: string;
  testType: string;
}

export interface RecommendationResponse {
  assessments: Assessment[];
  query: string;
}

export interface ApiRecommendation {
  name: string;
  url: string;
  remoteTestingSupport: boolean;
  adaptiveIRTSupport: boolean;
  duration: string;
  testType: string;
}

export interface ApiResponse {
  recommendations: ApiRecommendation[];
  query: string;
}

export interface EvaluationResult {
  meanRecallAt3: number;
  mapAt3: number;
  totalQueries: number;
}

export interface TestQuery {
  query: string;
  relevantAssessments: string[];
}

export interface GeminiSettings {
  apiKey: string;
  enabled: boolean;
}

export interface RagSettings {
  apiKey: string;
  endpoint: string;
  enabled: boolean;
}

export interface RecommendationSource {
  type: "rule-based" | "gemini" | "rag";
  name: string;
}

// API endpoint types
export interface ApiEndpoint {
  url: string;
  method: "GET" | "POST";
  description: string;
  exampleRequest?: any;
  exampleResponse?: any;
}
