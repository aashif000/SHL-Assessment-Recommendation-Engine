
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GeminiSettings } from "@/types";
import { Save, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GeminiSettingsProps {
  settings: GeminiSettings;
  onSave: (settings: GeminiSettings) => void;
}

const GeminiSettingsComponent = ({ settings, onSave }: GeminiSettingsProps) => {
  const [apiKey, setApiKey] = useState<string>(settings.apiKey || "");
  const [enabled, setEnabled] = useState<boolean>(settings.enabled || false);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const handleSave = () => {
    if (enabled && !apiKey) {
      toast.error("Please enter a Gemini API key to enable GenAI features");
      return;
    }
    
    // Save to localStorage for persistence
    localStorage.setItem("geminiSettings", JSON.stringify({ apiKey, enabled }));
    
    onSave({ apiKey, enabled });
    toast.success("Gemini API settings saved successfully");
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          GenAI Recommendations
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={18} className="ml-2 text-gray-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-sm">
                  Enable GenAI recommendations powered by Google's Gemini API. 
                  You'll need to provide your own API key from Google AI Studio.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Get intelligent assessment recommendations using Google's Gemini API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="gemini-enabled"
              checked={enabled} 
              onCheckedChange={setEnabled} 
            />
            <Label htmlFor="gemini-enabled">Enable GenAI recommendations</Label>
          </div>
          
          {enabled && (
            <div className="space-y-2">
              <Label htmlFor="apikey" className="text-sm font-medium">
                Gemini API Key
              </Label>
              <div className="flex items-center">
                <Input
                  id="apikey"
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
          )}
          
          <Button 
            className="mt-4" 
            onClick={handleSave} 
            type="button"
          >
            <Save size={16} className="mr-2" />
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeminiSettingsComponent;
