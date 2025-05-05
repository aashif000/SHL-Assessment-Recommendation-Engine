
import { EvaluationResult } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface EvaluationMetricsProps {
  metrics: EvaluationResult;
  showEvaluation: boolean;
}

const EvaluationMetrics = ({ metrics, showEvaluation }: EvaluationMetricsProps) => {
  if (!showEvaluation) return null;

  const formatPercent = (value: number) => {
    return (value * 100).toFixed(2) + "%";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Mean Recall@3</CardTitle>
          <CardDescription>
            The average percentage of relevant assessments found in the top 3 results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Score</span>
              <span className="text-sm font-medium">{formatPercent(metrics.meanRecallAt3)}</span>
            </div>
            <Progress value={metrics.meanRecallAt3 * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>MAP@3</CardTitle>
          <CardDescription>
            Mean Average Precision at 3 - evaluates both relevance and ranking quality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Score</span>
              <span className="text-sm font-medium">{formatPercent(metrics.mapAt3)}</span>
            </div>
            <Progress value={metrics.mapAt3 * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EvaluationMetrics;
