import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTopbarStore } from "@/lib/store/topbar-store";
import { toast } from "sonner";
import { 
  Upload, 
  Video, 
  Github, 
  FileText, 
  Plus,
  Trash2,
  Clock,
  Calendar as CalendarIcon
} from "lucide-react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Form schema for daily updates
const dailyUpdateFormSchema = z.object({
  type: z.enum(["file_upload", "screen_recording", "github_update", "project_transcript", "text_note"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  content: z.string().optional(), // For text notes
  
  // File upload
  fileName: z.string().optional(),
  fileSize: z.string().optional(),
  
  // Recording
  recordingDuration: z.string().optional(),
  recordingInterval: z.string().optional(),
  
  // GitHub
  githubUsername: z.string().optional(),
  githubRepo: z.string().optional(),
  githubCommits: z.string().optional(),
  
  // Transcript
  transcriptContent: z.string().optional(),
});

type DailyUpdateFormData = z.infer<typeof dailyUpdateFormSchema>;

interface DailyUpdate extends DailyUpdateFormData {
  id: string;
  date: string;
  createdAt: string;
}

const UPDATE_TYPE_ICONS = {
  file_upload: Upload,
  screen_recording: Video,
  github_update: Github,
  project_transcript: FileText,
  text_note: FileText,
};

const UPDATE_TYPE_LABELS = {
  file_upload: "File Upload",
  screen_recording: "Screen Recording",
  github_update: "GitHub Update",
  project_transcript: "Project Transcript",
  text_note: "Text Note",
};

const UPDATE_TYPE_COLORS = {
  file_upload: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  screen_recording: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  github_update: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  project_transcript: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  text_note: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

export default function DailyUpdatesPage() {
  const setTopbar = useTopbarStore((state) => state.setTopbar);
  const [updates, setUpdates] = useState<DailyUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    setTopbar("Daily Updates", "Track your daily progress and documentation");
    loadUpdates();
  }, [setTopbar]);

  const form = useForm<DailyUpdateFormData>({
    resolver: zodResolver(dailyUpdateFormSchema),
    defaultValues: {
      type: "text_note",
      title: "",
      description: "",
    },
  });

  const watchType = form.watch("type");

  const loadUpdates = async () => {
    try {
      const token = localStorage.getItem("session_token") || localStorage.getItem("token");
      const today = new Date().toISOString().split('T')[0];
      
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(`http://localhost:8000/api/daily-updates?date=${today}`, {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setUpdates(data);
      } else {
        console.error("Failed to load updates, status:", response.status);
      }
    } catch (error) {
      console.error("Failed to load updates:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      form.setValue("fileName", file.name);
      form.setValue("fileSize", `${(file.size / 1024).toFixed(2)} KB`);
    }
  };

  const handleSubmit = async (data: DailyUpdateFormData) => {
    setIsLoading(true);
    try {
      const userStr = localStorage.getItem("user");
      const token = localStorage.getItem("session_token") || localStorage.getItem("token");
      
      console.log("User from localStorage:", userStr);
      console.log("Token from localStorage:", token);
      
      if (!token) {
        toast.error("Please login first");
        return;
      }
      
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.id ? String(user.id) : "demo-user";
      const today = new Date().toISOString().split('T')[0];
      
      const payload = {
        ...data,
        userId,
        date: today,
      };

      console.log("Sending payload:", payload);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };

      const response = await fetch("http://localhost:8000/api/daily-updates", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        let errorMessage = "Failed to create update";
        try {
          const errorData = await response.json();
          console.log("Error data:", errorData);
          errorMessage = errorData.detail || errorMessage;
          if (typeof errorMessage === 'object') {
            errorMessage = JSON.stringify(errorMessage);
          }
        } catch (e) {
          const text = await response.text();
          console.log("Error text:", text);
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Success result:", result);

      toast.success("Update added successfully!");
      form.reset();
      setSelectedFile(null);
      loadUpdates();
    } catch (error) {
      console.error("Error creating update:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("session_token") || localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(`http://localhost:8000/api/daily-updates/${id}`, {
        method: "DELETE",
        headers
      });

      if (!response.ok) {
        throw new Error("Failed to delete update");
      }

      toast.success("Update deleted");
      loadUpdates();
    } catch (error) {
      toast.error("Failed to delete update");
    }
  };

  const handleUpdateAllToEvents = async () => {
    try {
      const token = localStorage.getItem("session_token") || localStorage.getItem("token");
      
      if (!token) {
        toast.error("Please login first");
        return;
      }

      if (updates.length === 0) {
        toast.error("No updates to process");
        return;
      }

      toast.info(`Processing ${updates.length} daily updates to extract events...`);

      const response = await fetch(`http://localhost:8000/api/daily-updates/update-all-to-events`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to process updates");
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(
          `Successfully created ${result.events_created} calendar events from ${result.total_updates_processed} daily updates!`
        );
        console.log("Created events:", result.events);
        console.log("Summary:", result.summary);
      } else {
        toast.error("Failed to create events");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process update";
      toast.error(errorMessage);
      console.error("Update to events error:", error);
    }
  };

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Update All to Events Button */}
        {updates.length > 0 && (
          <Card className="border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    Convert All Updates to Calendar Events
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Process all {updates.length} daily update{updates.length !== 1 ? 's' : ''} and automatically create calendar events using AI
                  </p>
                </div>
                <Button
                  onClick={handleUpdateAllToEvents}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  Update All to Events
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Add New Update Form */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Daily Update
            </CardTitle>
            <CardDescription>
              Upload files, record progress, share GitHub activity, or add notes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Update Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="file_upload">
                            <div className="flex items-center gap-2">
                              <Upload className="w-4 h-4" />
                              File Upload
                            </div>
                          </SelectItem>
                          <SelectItem value="screen_recording">
                            <div className="flex items-center gap-2">
                              <Video className="w-4 h-4" />
                              Screen Recording
                            </div>
                          </SelectItem>
                          <SelectItem value="github_update">
                            <div className="flex items-center gap-2">
                              <Github className="w-4 h-4" />
                              GitHub Update
                            </div>
                          </SelectItem>
                          <SelectItem value="project_transcript">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Project Transcript
                            </div>
                          </SelectItem>
                          <SelectItem value="text_note">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Text Note
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the type of update you want to add
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of your update" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add more details about your update..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Type-specific fields */}
                {watchType === "file_upload" && (
                  <div className="space-y-4">
                    <FormItem>
                      <FormLabel>Upload File</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-4">
                          <Input
                            type="file"
                            onChange={handleFileChange}
                            className="cursor-pointer"
                          />
                          {selectedFile && (
                            <Badge variant="secondary">
                              {selectedFile.name}
                            </Badge>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Upload documents, images, or any work-related files
                      </FormDescription>
                    </FormItem>
                  </div>
                )}

                {watchType === "screen_recording" && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="recordingDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="30"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Recording length
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="recordingInterval"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interval (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="5"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Capture every X minutes
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {watchType === "github_update" && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="githubUsername"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GitHub Username</FormLabel>
                          <FormControl>
                            <Input placeholder="octocat" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="githubRepo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Repository</FormLabel>
                          <FormControl>
                            <Input placeholder="owner/repo-name" {...field} />
                          </FormControl>
                          <FormDescription>
                            The repo you're working on
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="githubCommits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commit Summary</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="List of commits or work done..."
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {watchType === "project_transcript" && (
                  <FormField
                    control={form.control}
                    name="transcriptContent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transcript Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Paste your project transcript or meeting notes here..."
                            className="min-h-[200px] font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Meeting transcripts, project discussions, or documentation
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                )}

                {watchType === "text_note" && (
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Note Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Write your note here..."
                            className="min-h-[200px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Your daily note or update
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Adding..." : "Add Update"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Today's Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Today's Updates
            </CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {updates.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  No updates yet today. Start documenting your work!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {updates.map((update) => {
                  const Icon = UPDATE_TYPE_ICONS[update.type];
                  return (
                    <Card key={update.id} className="hover-elevate transition-all">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5 text-muted-foreground" />
                              <h3 className="font-semibold text-foreground">
                                {update.title}
                              </h3>
                              <Badge className={UPDATE_TYPE_COLORS[update.type]}>
                                {UPDATE_TYPE_LABELS[update.type]}
                              </Badge>
                            </div>

                            {update.description && (
                              <p className="text-sm text-muted-foreground">
                                {update.description}
                              </p>
                            )}

                            {update.type === "file_upload" && (
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {update.fileName && (
                                  <span>📄 {update.fileName}</span>
                                )}
                                {update.fileSize && (
                                  <span>{update.fileSize}</span>
                                )}
                              </div>
                            )}

                            {update.type === "screen_recording" && (
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {update.recordingDuration && (
                                  <span>⏱️ Duration: {update.recordingDuration} min</span>
                                )}
                                {update.recordingInterval && (
                                  <span>📸 Interval: {update.recordingInterval} min</span>
                                )}
                              </div>
                            )}

                            {update.type === "github_update" && (
                              <div className="space-y-2">
                                {update.githubUsername && (
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">Username: </span>
                                    <span className="font-mono">{update.githubUsername}</span>
                                  </div>
                                )}
                                {update.githubRepo && (
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">Repository: </span>
                                    <span className="font-mono">{update.githubRepo}</span>
                                  </div>
                                )}
                                {update.githubCommits && (
                                  <div className="text-sm text-muted-foreground mt-2">
                                    {update.githubCommits}
                                  </div>
                                )}
                              </div>
                            )}

                            {update.type === "project_transcript" && update.transcriptContent && (
                              <div className="bg-muted p-3 rounded-md text-sm font-mono max-h-40 overflow-y-auto">
                                {update.transcriptContent}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(update.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

