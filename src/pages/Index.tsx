
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import SearchForm from "@/components/SearchForm";
import RecommendationTable from "@/components/RecommendationTable";
import EvaluationMetrics from "@/components/EvaluationMetrics";
import GeminiSettings from "@/components/GeminiSettings";
import RagIntegration from "@/components/RagIntegration";
import { getRecommendations, createApiResponse } from "@/utils/recommendationEngine";
import { evaluateModel } from "@/utils/evaluationUtils";
import { 
  Assessment, 
  EvaluationResult, 
  GeminiSettings as GeminiSettingsType, 
  RagSettings as RagSettingsType,
  RecommendationSource,
  ApiEndpoint
} from "@/types";
import { Label } from "@/components/ui/label";

const Index = () => {
  const [query, setQuery] = useState<string>("");
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showEvaluation, setShowEvaluation] = useState<boolean>(false);
  const [evaluationMetrics, setEvaluationMetrics] = useState<EvaluationResult>({
    meanRecallAt3: 0,
    mapAt3: 0,
    totalQueries: 0
  });
  const [geminiSettings, setGeminiSettings] = useState<GeminiSettingsType>({
    apiKey: "",
    enabled: false
  });
  const [ragSettings, setRagSettings] = useState<RagSettingsType>({
    apiKey: "",
    endpoint: "",
    enabled: false
  });
  const [recommendationSource, setRecommendationSource] = useState<RecommendationSource | undefined>(undefined);
  const [apiResponse, setApiResponse] = useState<string>("");

  // API endpoints information
  const apiEndpoints: ApiEndpoint[] = [
    {
      url: "/api/health",
      method: "GET",
      description: "Health check endpoint to verify the API is running",
      exampleResponse: { status: "ok" }
    },
    {
      url: "/api/recommend",
      method: "POST",
      description: "Get assessment recommendations based on query",
      exampleRequest: { query: "I am hiring Java developers" },
      exampleResponse: {
        recommendations: [
          {
            name: "Core Java (Entry Level)",
            url: "https://www.shl.com/solutions/products/product-catalog/view/core-java-entry-level-new/",
            remoteTestingSupport: true,
            adaptiveIRTSupport: false,
            duration: "35 minutes",
            testType: "Technical"
          }
        ],
        query: "I am hiring Java developers"
      }
    }
  ];

  // Load settings from localStorage on component mount
  useEffect(() => {
    // Load Gemini settings
    const savedGeminiSettings = localStorage.getItem("geminiSettings");
    if (savedGeminiSettings) {
      try {
        setGeminiSettings(JSON.parse(savedGeminiSettings));
      } catch (error) {
        console.error("Error parsing saved Gemini settings:", error);
      }
    }
    
    // Load RAG settings
    const savedRagSettings = localStorage.getItem("ragSettings");
    if (savedRagSettings) {
      try {
        setRagSettings(JSON.parse(savedRagSettings));
      } catch (error) {
        console.error("Error parsing saved RAG settings:", error);
      }
    }
  }, []);

  const handleSearch = async (searchQuery: string) => {
    setIsLoading(true);
    setQuery(searchQuery);
    
    setTimeout(async () => {
      try {
        // Get recommendations using the enhanced method
        const { assessments: recommendations, source } = await getRecommendations(
          searchQuery, 
          10, 
          geminiSettings, 
          ragSettings
        );
        
        setAssessments(recommendations);
        setRecommendationSource(source);
        setShowResults(true);
        
        // Generate API response for display
        const apiResp = await createApiResponse(searchQuery, geminiSettings, ragSettings);
        setApiResponse(JSON.stringify(apiResp, null, 2));
        
        toast.success(
          `Recommendations generated successfully using ${source.name}!`, 
          { duration: 3000 }
        );
      } catch (error) {
        console.error("Error generating recommendations:", error);
        toast.error("Failed to generate recommendations. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }, 800); // Simulated delay to show loading state
  };

  const handleEvaluationToggle = (checked: boolean) => {
    setShowEvaluation(checked);
    
    if (checked) {
      // Run evaluation - properly handling the Promise
      setIsLoading(true);
      evaluateModel(3)
        .then(metrics => {
          setEvaluationMetrics(metrics);
          toast.success("Evaluation completed successfully!");
        })
        .catch(error => {
          console.error("Error during evaluation:", error);
          toast.error("Failed to complete evaluation");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  const handleSaveGeminiSettings = (settings: GeminiSettingsType) => {
    setGeminiSettings(settings);
  };
  
  const handleRagSettingsChange = (settings: RagSettingsType) => {
    setRagSettings(settings);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="gradient-bg p-6">
        <div className="container">
          <h1 className="text-white text-center text-4xl font-bold mb-2">
            SHL Assessment Match Wizard
          </h1>
          <p className="text-white text-center max-w-3xl mx-auto text-lg">
            Find the perfect SHL assessment for your hiring needs using natural language queries or job descriptions
          </p>
        </div>
      </header>
      
      <main className="container py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>How it works</CardTitle>
              <CardDescription>
                Enter a natural language query, job description, or URL to find the most relevant SHL assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-shl-blue text-xl font-bold mb-2">1</div>
                  <h3 className="font-semibold">Enter your query</h3>
                  <p className="text-sm text-gray-600">Describe the role or paste a job description</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-shl-blue text-xl font-bold mb-2">2</div>
                  <h3 className="font-semibold">Get recommendations</h3>
                  <p className="text-sm text-gray-600">Our system finds the best matching assessments</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-shl-blue text-xl font-bold mb-2">3</div>
                  <h3 className="font-semibold">Evaluate results</h3>
                  <p className="text-sm text-gray-600">Review and select the most suitable tests</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* RAG Integration Settings */}
          <RagIntegration onSettingsChange={handleRagSettingsChange} />
          
          {/* Gemini Settings Card */}
          <GeminiSettings 
            settings={geminiSettings}
            onSave={handleSaveGeminiSettings}
          />
          
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />
          
          {showResults && (
            <RecommendationTable 
              assessments={assessments} 
              query={query} 
              source={recommendationSource} 
            />
          )}
          
          <div className="mt-6 flex items-center space-x-2">
            <Switch id="evaluation-mode" checked={showEvaluation} onCheckedChange={handleEvaluationToggle} />
            <Label htmlFor="evaluation-mode">Show evaluation metrics</Label>
          </div>
          
          <EvaluationMetrics metrics={evaluationMetrics} showEvaluation={showEvaluation} />
          
          {/* API documentation section */}
          {showResults && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>API Access</CardTitle>
                <CardDescription>
                  Access our recommendation engine programmatically using the REST API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Available Endpoints</h3>
                    <div className="space-y-4">
                      {apiEndpoints.map((endpoint, index) => (
                        <div key={index} className="border rounded-md p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs font-bold rounded ${
                              endpoint.method === "GET" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                            }`}>
                              {endpoint.method}
                            </span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">{endpoint.url}</code>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{endpoint.description}</p>
                          {endpoint.exampleRequest && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Example Request:</p>
                              <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto text-xs">
                                {JSON.stringify(endpoint.exampleRequest, null, 2)}
                              </pre>
                            </div>
                          )}
                          {endpoint.exampleResponse && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Example Response:</p>
                              <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto text-xs">
                                {JSON.stringify(endpoint.exampleResponse, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Generated API Response for Current Query</h3>
                    <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs max-h-64 overflow-y-auto">
                      {apiResponse}
                    </pre>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Example API Usage</h3>
                    <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs">
{`// Example API request
fetch('https://api.assessmatch-wizard.com/recommend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: "${query.replace(/"/g, '\\"')}" })
})
.then(response => response.json())
.then(data => console.log(data));`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <footer className="bg-shl-darkBlue text-white py-6">
        <div className="container text-center">
          <p>© 2025 SHL Assessment Match Wizard</p>
          <div className="mt-2 text-sm text-gray-300">
            <span>Built with <span className="text-red-400">♥</span> using React + AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
