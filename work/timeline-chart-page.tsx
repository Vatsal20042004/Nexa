import { useState } from "react";
import { ArrowLeft, Upload, FileText, Send, Users, Download, Edit2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { toast } from "sonner";

type Step = "upload" | "summary" | "chart";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

// Dummy team members data
const dummyTeamMembers: TeamMember[] = [
  { id: "1", name: "John Smith", role: "Senior Developer", email: "john.smith@company.com" },
  { id: "2", name: "Sarah Johnson", role: "UI/UX Designer", email: "sarah.johnson@company.com" },
  { id: "3", name: "Mike Chen", role: "Backend Developer", email: "mike.chen@company.com" },
  { id: "4", name: "Emily Davis", role: "Frontend Developer", email: "emily.davis@company.com" },
  { id: "5", name: "David Wilson", role: "QA Engineer", email: "david.wilson@company.com" },
  { id: "6", name: "Lisa Anderson", role: "Project Manager", email: "lisa.anderson@company.com" },
  { id: "7", name: "Tom Martinez", role: "DevOps Engineer", email: "tom.martinez@company.com" },
];

// Dummy summary data (will come from backend)
const dummySummary = `# Project Timeline Summary

## Project Overview
This project aims to develop a comprehensive work management console with integrated AI assistance and team collaboration features.

## Key Milestones

### Phase 1: Foundation (Weeks 1-2)
- Set up project infrastructure
- Design database schema
- Create basic UI components

### Phase 2: Core Features (Weeks 3-5)
- Implement task management system
- Develop calendar integration
- Build project tracking dashboard

### Phase 3: Advanced Features (Weeks 6-8)
- Integrate AI assistant
- Implement team leader chat
- Add timeline chart visualization

### Phase 4: Testing & Deployment (Weeks 9-10)
- Comprehensive testing
- Bug fixes and optimization
- Production deployment

## Team Assignments
- Frontend Development: Emily Davis, Sarah Johnson
- Backend Development: Mike Chen, John Smith
- Quality Assurance: David Wilson
- Project Management: Lisa Anderson
- Infrastructure: Tom Martinez

## Estimated Timeline
Total Duration: 10 weeks
Start Date: January 1, 2025
Expected Completion: March 15, 2025`;

export default function TimelineChartPage() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [textInput, setTextInput] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>(["1", "2", "3", "4", "5"]);
  const [summary, setSummary] = useState(dummySummary);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState(dummySummary);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  // Dummy file upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles: UploadedFile[] = Array.from(files).map((file, index) => ({
        id: `file-${Date.now()}-${index}`,
        name: file.name,
        size: file.size,
        type: file.type,
      }));
      setUploadedFiles([...uploadedFiles, ...newFiles]);
      toast.success(`${newFiles.length} file(s) uploaded successfully`);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter(f => f.id !== id));
  };

  const handleGenerateSummary = () => {
    if (uploadedFiles.length === 0 && textInput.trim() === "") {
      toast.error("Please upload files or enter text to generate summary");
      return;
    }

    // TODO: Send files/text to backend for summary generation
    // const response = await fetch('/api/timeline/generate-summary', {
    //   method: 'POST',
    //   body: formData
    // });
    
    toast.success("Generating summary from uploaded data...");
    setTimeout(() => {
      setCurrentStep("summary");
      toast.success("Summary generated successfully!");
    }, 1000);
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSaveSummary = () => {
    setSummary(editedSummary);
    setIsEditingSummary(false);
    toast.success("Summary updated successfully");
  };

  const handleGenerateChart = () => {
    if (selectedMembers.length === 0) {
      toast.error("Please select at least one team member");
      return;
    }

    // TODO: Send summary and selected members to backend for chart generation
    // const response = await fetch('/api/timeline/generate-chart', {
    //   method: 'POST',
    //   body: JSON.stringify({ summary, memberIds: selectedMembers })
    // });
    
    toast.success("Generating timeline chart...");
    setTimeout(() => {
      setCurrentStep("chart");
      toast.success("Timeline chart generated successfully!");
    }, 1500);
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Timeline Chart Generator</h1>
            <p className="text-muted-foreground">
              Upload project documents and generate visual timeline charts
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-4">
        <div className={`flex items-center gap-2 ${currentStep === "upload" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "upload" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
            1
          </div>
          <span className="font-medium">Upload</span>
        </div>
        <div className="w-12 h-0.5 bg-muted" />
        <div className={`flex items-center gap-2 ${currentStep === "summary" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "summary" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
            2
          </div>
          <span className="font-medium">Summary</span>
        </div>
        <div className="w-12 h-0.5 bg-muted" />
        <div className={`flex items-center gap-2 ${currentStep === "chart" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "chart" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
            3
          </div>
          <span className="font-medium">Chart</span>
        </div>
      </div>

      {/* Step 1: Upload */}
      {currentStep === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Project Documents</CardTitle>
            <CardDescription>
              Upload files or enter text to generate a project timeline summary
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Upload Files</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop files here or click to browse
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.txt,.md"
                />
                <Button asChild variant="outline">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Files
                  </label>
                </Button>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Uploaded Files ({uploadedFiles.length})</h4>
                  <div className="max-h-40 overflow-y-auto border rounded-lg p-4">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between py-2 px-3 mb-2 bg-muted rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Text Input */}
            <div className="space-y-2">
              <Label htmlFor="text-input">Or Enter Text Directly</Label>
              <Textarea
                id="text-input"
                placeholder="Paste project details, requirements, or any relevant information here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            {/* Generate Button */}
            <div className="pt-4">
              <Button
                onClick={handleGenerateSummary}
                size="lg"
                className="w-full"
                disabled={uploadedFiles.length === 0 && textInput.trim() === ""}
              >
                <Send className="w-4 h-4 mr-2" />
                Generate Summary
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Summary & Team Selection */}
      {currentStep === "summary" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Project Summary</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isEditingSummary) {
                      handleSaveSummary();
                    } else {
                      setEditedSummary(summary);
                      setIsEditingSummary(true);
                    }
                  }}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  {isEditingSummary ? "Save" : "Edit"}
                </Button>
              </div>
              <CardDescription>
                Review and edit the generated summary
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditingSummary ? (
                <div className="space-y-4">
                  <Textarea
                    value={editedSummary}
                    onChange={(e) => setEditedSummary(e.target.value)}
                    rows={20}
                    className="font-mono text-sm resize-none"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveSummary}>Save Changes</Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditingSummary(false);
                        setEditedSummary(summary);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap">{summary}</div>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Team Members Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Members
                </CardTitle>
                <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Team Member</DialogTitle>
                      <DialogDescription>
                        Add a new team member to the project
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="member-name">Name</Label>
                        <Input id="member-name" placeholder="John Doe" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="member-role">Role</Label>
                        <Input id="member-role" placeholder="Developer" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="member-email">Email</Label>
                        <Input id="member-email" type="email" placeholder="john@company.com" />
                      </div>
                    </div>
                    <Button onClick={() => {
                      toast.success("Team member added");
                      setIsAddMemberOpen(false);
                    }}>
                      Add Member
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>
              <CardDescription>
                Select team members for the timeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  {dummyTeamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => toggleMember(member.id)}
                    >
                      <Checkbox
                        checked={selectedMembers.includes(member.id)}
                        onCheckedChange={() => toggleMember(member.id)}
                      />
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {member.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="mt-4 pt-4 border-t space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Selected Members</span>
                  <Badge variant="secondary">{selectedMembers.length}</Badge>
                </div>
                <Button
                  onClick={handleGenerateChart}
                  size="lg"
                  className="w-full"
                  disabled={selectedMembers.length === 0}
                >
                  Generate Timeline Chart
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Timeline Chart */}
      {currentStep === "chart" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Timeline Chart</CardTitle>
                <CardDescription>
                  Visual representation of your project timeline
                </CardDescription>
              </div>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Chart
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* TODO: Display actual timeline chart image from backend */}
            {/* const chartImage = await fetch('/api/timeline/get-chart-image').then(res => res.blob()); */}
            
            {/* Dummy Timeline Chart Placeholder */}
            <div className="border rounded-lg p-8 bg-muted/30">
              <div className="aspect-video bg-gradient-to-br from-primary/10 via-background to-primary/5 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                    <FileText className="w-12 h-12 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Timeline Chart Generated</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Chart image will be loaded from backend
                    </p>
                    <Badge variant="outline">Dummy Placeholder</Badge>
                  </div>
                  {/* This is where the actual chart image would be displayed */}
                  <p className="text-xs text-muted-foreground font-mono mt-8">
                    {/* Backend API: GET /api/timeline/get-chart-image */}
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Team Members Display */}
            <div className="mt-6 space-y-4">
              <h4 className="font-semibold">Team Members in Timeline</h4>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map(memberId => {
                  const member = dummyTeamMembers.find(m => m.id === memberId);
                  return member ? (
                    <Badge key={member.id} variant="secondary" className="px-3 py-2">
                      <Avatar className="w-5 h-5 mr-2">
                        <AvatarFallback className="text-xs">
                          {member.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      {member.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("summary")}
              >
                Edit Summary
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentStep("upload")}
              >
                Start New
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
