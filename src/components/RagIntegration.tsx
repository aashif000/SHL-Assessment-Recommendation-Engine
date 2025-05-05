
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, FileX, Info } from "lucide-react";
import { RagSettings } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RagIntegrationProps {
  onSettingsChange: (settings: RagSettings) => void;
}

const RagIntegration = ({ onSettingsChange }: RagIntegrationProps) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [ragEndpoint, setRagEndpoint] = useState<string>("");
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isRagEnabled, setIsRagEnabled] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Load saved settings on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("ragSettings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setApiKey(settings.apiKey || "");
        setRagEndpoint(settings.endpoint || "");
        setIsRagEnabled(settings.enabled || false);
        
        // Notify parent component of loaded settings
        onSettingsChange({
          apiKey: settings.apiKey || "",
          endpoint: settings.endpoint || "",
          enabled: settings.enabled || false
        });
      } catch (error) {
        console.error("Error parsing saved RAG settings:", error);
      }
    }
  }, [onSettingsChange]);

  const handleSave = () => {
    if (isRagEnabled && (!apiKey || !ragEndpoint)) {
      toast.error("Please enter both Gemini API key and RAG endpoint URL to enable RAG features");
      return;
    }
    
    // Create settings object
    const settings: RagSettings = {
      apiKey,
      endpoint: ragEndpoint,
      enabled: isRagEnabled
    };
    
    // Save to localStorage for persistence
    localStorage.setItem("ragSettings", JSON.stringify(settings));
    
    // Notify parent component of settings change
    onSettingsChange(settings);
    toast.success("RAG integration settings saved successfully");
  };

  // Mock file upload functionality
  const handleFileUpload = () => {
    if (!isRagEnabled || !ragEndpoint) {
      toast.error("Please enable RAG and provide a valid endpoint first");
      return;
    }
    
    setIsUploading(true);
    
    // Simulate file upload
    setTimeout(() => {
      setIsUploading(false);
      toast.success("PDF uploaded successfully to RAG system!");
    }, 2000);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          RAG Integration (Retrieval Augmented Generation)
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={18} className="ml-2 text-gray-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-sm">
                  Connect to your Python-based RAG system for enhanced assessment recommendations.
                  RAG systems combine document knowledge with AI for more accurate results.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Connect to your Python Gemini-powered RAG system for enhanced recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="rag-enabled"
              checked={isRagEnabled} 
              onCheckedChange={setIsRagEnabled} 
            />
            <Label htmlFor="rag-enabled">Enable RAG recommendations</Label>
          </div>
          
          {isRagEnabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rag-apikey" className="text-sm font-medium">
                  Gemini API Key
                </Label>
                <div className="flex items-center">
                  <Input
                    id="rag-apikey"
                    type={isVisible ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="ml-2"
                    onClick={() => setIsVisible(!isVisible)}
                  >
                    {isVisible ? "Hide" : "Show"}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  You can get your API key from{" "}
                  <a 
                    href="https://ai.google.dev/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-shl-blue hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rag-endpoint" className="text-sm font-medium">
                  RAG Endpoint URL
                </Label>
                <Input
                  id="rag-endpoint"
                  type="text"
                  value={ragEndpoint}
                  onChange={(e) => setRagEndpoint(e.target.value)}
                  placeholder="http://localhost:8000/api/rag"
                  className="flex-1"
                />
                <p className="text-xs text-gray-500">
                  URL to your Python RAG service endpoint
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-200">
                <Label className="text-sm font-medium">Document Management</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    variant="outline" 
                    className="flex gap-2 items-center"
                    onClick={handleFileUpload}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-shl-blue border-t-transparent rounded-full"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Upload PDF to RAG system
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex gap-2 items-center"
                    disabled={isUploading}
                  >
                    <FileX size={16} />
                    Clear RAG documents
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Upload PDFs to your RAG system for enhanced context-based recommendations
                </p>
              </div>
            </div>
          )}
          
          <Button 
            className="mt-4" 
            onClick={handleSave}
            type="button"
          >
            Save RAG Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RagIntegration;
