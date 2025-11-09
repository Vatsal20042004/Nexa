import { useState, useRef } from "react";
import { Upload, FileText, Users, CheckCircle, BarChart3, Download, Sparkles } from "lucide-react";
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
      const formData = new FormData();
      formData.append("project_name", projectName);
      formData.append("selected_member_ids", JSON.stringify(selectedMembers));
      if (textInput.trim()) {
        formData.append("text_input", textInput);
      }
      uploadedFiles.forEach(file => {
        formData.append("files", file.file);
      });

      const token = localStorage.getItem("session_token") || localStorage.getItem("token");
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/team-leader/timeline/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to generate timeline");

      const data = await response.json();
      setChartData(data);
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
              {isGenerating ? "Generating..." : "Generate Timeline Chart"}
            </Button>
          </div>
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
                {chartData.image_base64 && (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <img
                      src={`data:image/png;base64,${chartData.image_base64}`}
                      alt="Timeline Chart"
                      className="w-full h-auto"
                    />
                  </div>
                )}

                {/* Summary */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Summary & Analysis</h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none bg-card border rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm">{chartData.summary_text}</pre>
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
