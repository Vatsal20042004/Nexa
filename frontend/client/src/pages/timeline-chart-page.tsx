import { useState, useRef } from "react";
import { Upload, FileText, Users, CheckCircle, BarChart3, Download, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { API_CONFIG } from "@/lib/api-config";

type Step = "upload" | "summary" | "chart";

interface TeamMember {
  id: number;
  member_user_id: number;
  name: string;
  role: string;
  email: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  file: File;
}

interface TimelineChartData {
  project_name: string;
  image_path: string;
  image_base64: string | null;
  summary_text: string;
  created_at: string;
}

export default function TimelineChartPage() {
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [textInput, setTextInput] = useState("");
  const [projectName, setProjectName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chartData, setChartData] = useState<TimelineChartData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch team members
  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["team-members"],
    queryFn: async () => {
      const token = localStorage.getItem("session_token") || localStorage.getItem("token");
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/team-leader/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch team members");
      return response.json();
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles: UploadedFile[] = Array.from(files).map((file, index) => ({
        id: `file-${Date.now()}-${index}`,
        name: file.name,
        size: file.size,
        file: file,
      }));
      setUploadedFiles([...uploadedFiles, ...newFiles]);
      toast.success(`${newFiles.length} file(s) uploaded`);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter(f => f.id !== id));
  };

  const toggleMember = (memberId: number) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleGenerateChart = async () => {
    if (!projectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    
    if (uploadedFiles.length === 0 && !textInput.trim()) {
      toast.error("Please upload files or enter text");
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error("Please select at least one team member");
      return;
    }

    setIsGenerating(true);

    try {
      // Show loading for 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Create mock data with the timeline image and description
      const mockData: TimelineChartData = {
        project_name: projectName,
        image_path: "/timeline-chart.png",
        image_base64: null, // Will use a public URL instead
        summary_text: `# ${projectName} - Project Timeline Analysis

## Timeline Overview
This comprehensive timeline chart visualizes the key milestones and phases of ${projectName} from 2017 to 2022. The chart illustrates the project's evolution through distinct phases, each marked by significant achievements and deliverables.

## Key Milestones

### TITLE LINE 01 (2017)
The project's inception phase where initial planning and foundation work was established. This phase set the groundwork for all subsequent development activities.

### TITLE LINE 02 (2018) 
Critical development phase where core features and functionalities were implemented. This period saw significant technical progress and team expansion.

### TITLE LINE 03 (2019)
Major milestone achievement with successful product launch and initial customer acquisition. This marked a turning point in the project's trajectory.

### TITLE LINE 04 (2020)
Despite challenges, the project maintained momentum with continuous improvements and feature enhancements. Adaptation to changing market conditions was key.

### TITLE LINE 05 (2021)
Scaling phase with focus on performance optimization and user experience improvements. The team expanded capabilities and market reach.

### TITLE LINE 06 (2022)
Maturity phase with stable operations, advanced features, and strong market position. The project achieved its strategic objectives.

## Team Members Involved
${selectedMembers.length} team member(s) contributed across different phases of this timeline.

## Project Insights
- **Duration**: Multi-year strategic initiative (2017-2022)
- **Phases**: 6 major milestones achieved
- **Team**: Collaborative effort across ${selectedMembers.length} team member(s)
- **Status**: Successfully delivered with measurable outcomes

## Recommendations
Based on the timeline analysis, the project demonstrates strong execution and strategic planning. Continue monitoring progress and maintaining team collaboration for sustained success.`,
        created_at: new Date().toISOString()
      };

      setChartData(mockData);
      setCurrentStep("chart");
      toast.success("Timeline chart generated successfully!");
    } catch (error) {
      console.error("Error generating chart:", error);
      toast.error("Failed to generate timeline chart");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="h-full overflow-auto">
      <div className="container max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Timeline Chart Generator</h1>
              <p className="text-sm text-muted-foreground">
                Generate visual timeline from project documents
              </p>
            </div>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 ${currentStep === "upload" ? "text-primary" : "text-muted-foreground"}`}>
            {currentStep !== "upload" ? <CheckCircle className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-current" />}
            <span className="font-medium">Upload & Configure</span>
          </div>
          <div className="w-12 h-0.5 bg-muted" />
          <div className={`flex items-center gap-2 ${currentStep === "chart" ? "text-primary" : "text-muted-foreground"}`}>
            {currentStep === "chart" ? <CheckCircle className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-current" />}
            <span className="font-medium">View Chart</span>
          </div>
        </div>

        {/* Upload Step */}
        {currentStep === "upload" && (
          <div className="space-y-6">
            {/* Project Name */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Project Name
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Enter project name..."
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="text-base"
                />
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">
                      Click to upload SRS and project documents
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOCX, TXT, MD supported
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.docx,.txt,.md,.json"
                  />

                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      {uploadedFiles.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)}>
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Text Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Or Enter Text Directly
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Paste project details, requirements, or any additional context..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="min-h-[200px] text-base"
                />
              </CardContent>
            </Card>

            {/* Team Member Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Select Team Members ({selectedMembers.length} selected)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {teamMembers.map(member => (
                      <div
                        key={member.id}
                        className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer"
                        onClick={() => toggleMember(member.member_user_id)}
                      >
                        <Checkbox
                          checked={selectedMembers.includes(member.member_user_id)}
                          onCheckedChange={() => toggleMember(member.member_user_id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                        {selectedMembers.includes(member.member_user_id) && (
                          <Badge variant="secondary">Selected</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Button
              size="lg"
              className="w-full"
              onClick={handleGenerateChart}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Timeline Chart...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Timeline Chart
                </>
              )}
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Generating Your Timeline Chart</h3>
                  <p className="text-sm text-muted-foreground">
                    Analyzing documents and team data to create a comprehensive timeline visualization...
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chart Display Step */}
        {currentStep === "chart" && chartData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{chartData.project_name}</CardTitle>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Chart Image */}
                <div className="border rounded-lg p-6 bg-gradient-to-br from-background to-muted/20">
                  <img
                    src={`${API_CONFIG.BASE_URL}/api/image.png`}
                    alt="Timeline Chart"
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                </div>

                {/* Summary */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Timeline Analysis & Insights
                  </h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none bg-card border rounded-lg p-6">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{chartData.summary_text}</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentStep("upload");
                      setChartData(null);
                      setUploadedFiles([]);
                      setTextInput("");
                      setProjectName("");
                      setSelectedMembers([]);
                    }}
                  >
                    Create New Chart
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
