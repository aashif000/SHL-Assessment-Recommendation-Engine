
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Search } from "lucide-react";

interface SearchFormProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const SearchForm = ({ onSearch, isLoading }: SearchFormProps) => {
  const [activeTab, setActiveTab] = useState<string>("query");
  const [query, setQuery] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [url, setUrl] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === "query" && query.trim() === "") {
      toast.error("Please enter a query");
      return;
    }
    
    if (activeTab === "description" && jobDescription.trim() === "") {
      toast.error("Please enter a job description");
      return;
    }
    
    if (activeTab === "url" && url.trim() === "") {
      toast.error("Please enter a URL");
      return;
    }
    
    let searchQuery = "";
    
    switch (activeTab) {
      case "query":
        searchQuery = query;
        break;
      case "description":
        searchQuery = jobDescription;
        break;
      case "url":
        searchQuery = `URL: ${url}`;
        break;
      default:
        searchQuery = query;
    }
    
    onSearch(searchQuery);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleSampleQuery = () => {
    const sampleQueries = [
      "I am hiring for Java developers who can also collaborate effectively with my business teams. Looking for an assessment(s) that can be completed in 40 minutes.",
      "Looking to hire mid-level professionals who are proficient in Python, SQL and Java Script. Need an assessment package that can test all skills with max duration of 60 minutes.",
      "I am hiring for an analyst and want applications to screen using Cognitive and personality tests, what options are available within 45 mins.",
      "Content Writer required, expert in English and SEO."
    ];
    
    const randomQuery = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
    setQuery(randomQuery);
    setActiveTab("query");
  };

  return (
    <div className="w-full bg-white rounded-lg p-6 shadow-lg">
      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="query" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="query">Natural Language Query</TabsTrigger>
            <TabsTrigger value="description">Job Description</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
          </TabsList>
          
          <TabsContent value="query">
            <div className="space-y-2">
              <label htmlFor="query" className="block text-sm font-medium text-gray-700">
                Enter your query
              </label>
              <Input
                id="query"
                placeholder="e.g., I am hiring Java developers, looking for assessments within 40 minutes..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="description">
            <div className="space-y-2">
              <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700">
                Enter job description
              </label>
              <Textarea
                id="jobDescription"
                placeholder="Paste the full job description here..."
                rows={5}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="url">
            <div className="space-y-2">
              <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                Enter URL to job posting
              </label>
              <Input
                id="url"
                placeholder="https://example.com/job-posting"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Note: URL content will be fetched and analyzed for assessment matching
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button 
            type="submit" 
            className="bg-shl-blue hover:bg-shl-darkBlue flex-1"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Search size={18} />
                Find Assessments
              </span>
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleSampleQuery}
            disabled={isLoading}
          >
            Try Sample Query
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SearchForm;
