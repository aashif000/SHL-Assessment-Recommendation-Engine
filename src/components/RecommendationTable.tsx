
import { Assessment, RecommendationSource } from "@/types";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Zap } from "lucide-react";

interface RecommendationTableProps {
  assessments: Assessment[];
  query: string;
  source?: RecommendationSource;
}

const RecommendationTable = ({ assessments, query, source }: RecommendationTableProps) => {
  if (assessments.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-lg mt-6">
        <p className="text-center text-gray-500">No assessments found for your query.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg mt-6 overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-shl-darkBlue">Recommended Assessments</h2>
        
        {source && (
          <Badge 
            variant={source.type === "gemini" ? "default" : "outline"}
            className={`flex items-center gap-1 ${
              source.type === "gemini" ? "bg-purple-600 hover:bg-purple-700" : ""
            }`}
          >
            {source.type === "gemini" && <Zap size={14} />}
            {source.name}
          </Badge>
        )}
      </div>
      
      <Table>
        <TableCaption>Assessment recommendations based on your query</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Assessment Name</TableHead>
            <TableHead className="text-center">Remote Testing</TableHead>
            <TableHead className="text-center">Adaptive/IRT Support</TableHead>
            <TableHead className="text-center">Duration</TableHead>
            <TableHead className="text-center">Test Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assessments.map((assessment, index) => (
            <TableRow key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <TableCell className="font-medium">
                <a 
                  href={assessment.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-shl-blue hover:text-shl-lightBlue hover:underline"
                >
                  {assessment.name.replace(" | SHL", "")}
                </a>
              </TableCell>
              <TableCell className="text-center">
                {assessment.remoteTestingSupport ? (
                  <CheckCircle className="h-5 w-5 text-green-500 inline" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 inline" />
                )}
              </TableCell>
              <TableCell className="text-center">
                {assessment.adaptiveIRTSupport ? (
                  <CheckCircle className="h-5 w-5 text-green-500 inline" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 inline" />
                )}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className="bg-shl-gray">
                  {assessment.duration}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge className="bg-shl-lightBlue hover:bg-shl-blue">
                  {assessment.testType}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RecommendationTable;
