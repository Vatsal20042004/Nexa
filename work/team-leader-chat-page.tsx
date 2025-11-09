import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Mic, Paperclip, Sparkles, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTopbarStore } from "@/lib/store/topbar-store";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  mentionedMembers?: string[];
}

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
}

// Dummy team members data
const dummyTeamMembers: TeamMember[] = [
  { id: "1", name: "John Smith", role: "Senior Developer", email: "john.smith@company.com" },
  { id: "2", name: "Sarah Johnson", role: "UI/UX Designer", email: "sarah.johnson@company.com" },
  { id: "3", name: "Mike Chen", role: "Backend Developer", email: "mike.chen@company.com" },
  { id: "4", name: "Emily Davis", role: "Frontend Developer", email: "emily.davis@company.com" },
  { id: "5", name: "David Wilson", role: "QA Engineer", email: "david.wilson@company.com" },
  { id: "6", name: "Lisa Anderson", role: "Product Manager", email: "lisa.anderson@company.com" },
  { id: "7", name: "Robert Martinez", role: "DevOps Engineer", email: "robert.martinez@company.com" },
  { id: "8", name: "Jennifer Taylor", role: "Business Analyst", email: "jennifer.taylor@company.com" },
];

const suggestions = [
  "Schedule team meeting",
  "Get project status",
  "Review team performance",
  "Plan sprint activities",
  "Assign tasks to team"
];

export default function TeamLeaderChatPage() {
  const setTopbar = useTopbarStore((state) => state.setTopbar);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [responseMode, setResponseMode] = useState("precise");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [teamMembers] = useState<TeamMember[]>(dummyTeamMembers);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    try {
      setTopbar("Team Leader AI Chat", "Collaborate and manage your team with AI assistance");
    } catch (error) {
      console.error("Error setting topbar:", error);
    }
  }, [setTopbar]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(prev => prev + (prev ? ' ' : '') + transcript);
          setIsRecording(false);
        };

        recognitionRef.current.onerror = (error: any) => {
          console.error("Speech recognition error:", error);
          setIsRecording(false);
          toast.error("Voice input failed. Please try again.");
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    } catch (error) {
      console.error("Error initializing speech recognition:", error);
    }
  }, []);

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const simulateStreaming = async (text: string) => {
    const words = text.split(" ");
    let currentText = "";

    const messageId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      { id: messageId, role: "assistant", content: "" },
    ]);

    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? " " : "") + words[i];
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, content: currentText } : msg
        )
      );
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    // Prepare payload for backend
    const payload = {
      message: input,
      mentionedMembers: selectedMembers.map(id => {
        const member = teamMembers.find(m => m.id === id);
        return {
          id: member?.id,
          name: member?.name,
          email: member?.email,
          role: member?.role
        };
      }),
      responseMode,
      attachedFiles: attachedFiles.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      }))
    };

    console.log("Team Leader Chat Payload:", payload);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      mentionedMembers: selectedMembers,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setAttachedFiles([]);
    setSelectedMembers([]);
    setIsStreaming(true);

    // Simulate backend call
    try {
      const responses = [
        `I've analyzed your request regarding "${currentInput.substring(0, 50)}...". ${selectedMembers.length > 0 ? `I'll notify ${selectedMembers.length} team member(s) about this.` : ''} Based on current team capacity, I recommend scheduling this for next week.`,
        `Great idea! ${selectedMembers.length > 0 ? `The selected team members are available` : 'Your team is available'} for this task. Would you like me to create a detailed action plan?`,
        `I've reviewed the team's current workload. ${selectedMembers.length > 0 ? 'The mentioned members' : 'The team'} can handle this with proper task distribution. Shall I draft a proposal?`,
        `Understood. I'll help coordinate this with ${selectedMembers.length > 0 ? 'the selected team members' : 'your team'}. Based on their schedules, I suggest a collaborative approach starting tomorrow.`,
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      await simulateStreaming(randomResponse);
      
      if (payload.mentionedMembers.length > 0) {
        toast.success(`Message will be shared with ${payload.mentionedMembers.length} team member(s)`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
      setMessages((prev) => prev.filter(msg => msg.id !== userMessage.id));
      setInput(currentInput);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error("Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    try {
      if (isRecording) {
        recognitionRef.current.stop();
        setIsRecording(false);
      } else {
        recognitionRef.current.start();
        setIsRecording(true);
        toast.info("Listening... Speak now");
      }
    } catch (error) {
      console.error("Voice input error:", error);
      toast.error("Failed to start voice input");
      setIsRecording(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = Array.from(e.target.files || []);
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      const validFiles = files.filter(file => {
        if (file.size > maxSize) {
          toast.error(`${file.name} is too large. Max size is 10MB.`);
          return false;
        }
        return true;
      });

      const newFiles: AttachedFile[] = validFiles.map(file => ({
        id: Date.now().toString() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type
      }));
      
      setAttachedFiles(prev => [...prev, ...newFiles]);
      
      if (newFiles.length > 0) {
        toast.success(`${newFiles.length} file(s) attached`);
      }
    } catch (error) {
      console.error("Error attaching files:", error);
      toast.error("Failed to attach files");
    }
  };

  const removeFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full">
          <div className="text-center mb-12 space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-foreground" data-testid="text-team-leader-greeting">
              {getGreeting()}, Team Leader
            </h1>
            <p className="text-xl text-muted-foreground" data-testid="text-team-leader-subtitle">
              How can I help you manage your team today?
            </p>
          </div>

          <Card className="w-full max-w-3xl shadow-xl border-2">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything about your team..."
                    className="w-full min-h-[120px] px-4 py-3 text-base bg-background border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="input-team-leader-message"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  
                  {attachedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {attachedFiles.map(file => (
                        <Badge key={file.id} variant="secondary" className="gap-2 pl-3 pr-2 py-1" data-testid={`badge-file-${file.id}`}>
                          <span className="text-xs">{file.name} ({formatFileSize(file.size)})</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => removeFile(file.id)}
                            data-testid={`button-remove-file-${file.id}`}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {selectedMembers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedMembers.map(memberId => {
                        const member = teamMembers.find(m => m.id === memberId);
                        return member ? (
                          <Badge key={memberId} variant="outline" className="gap-2 pl-3 pr-2 py-1 bg-blue-50 dark:bg-blue-950" data-testid={`badge-member-${memberId}`}>
                            <Users className="w-3 h-3" />
                            <span className="text-xs">{member.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => toggleMemberSelection(memberId)}
                              data-testid={`button-remove-member-${memberId}`}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Select value={responseMode} onValueChange={setResponseMode}>
                      <SelectTrigger className="w-40" data-testid="select-response-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="precise">Precise</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                      </SelectContent>
                    </Select>

                    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="relative"
                          data-testid="button-select-team-members"
                        >
                          <Users className="w-5 h-5" />
                          {selectedMembers.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {selectedMembers.length}
                            </span>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-72">
                        <DropdownMenuLabel>Select Team Members</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <ScrollArea className="h-64">
                          {teamMembers.map(member => (
                            <DropdownMenuItem
                              key={member.id}
                              className="flex items-start gap-3 p-3 cursor-pointer"
                              onSelect={(e) => {
                                e.preventDefault();
                                toggleMemberSelection(member.id);
                              }}
                              data-testid={`dropdown-member-${member.id}`}
                            >
                              <Checkbox
                                checked={selectedMembers.includes(member.id)}
                                onCheckedChange={() => toggleMemberSelection(member.id)}
                                data-testid={`checkbox-member-${member.id}`}
                              />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{member.name}</div>
                                <div className="text-xs text-muted-foreground">{member.role}</div>
                                <div className="text-xs text-muted-foreground">{member.email}</div>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </ScrollArea>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-attach-file"
                    >
                      <Paperclip className="w-5 h-5" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleVoiceInput}
                      className={isRecording ? "text-red-500" : ""}
                      data-testid="button-voice-input"
                    >
                      <Mic className={`w-5 h-5 ${isRecording ? "animate-pulse" : ""}`} />
                    </Button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={!input.trim() || isStreaming}
                    className="gap-2"
                    data-testid="button-send-message"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3 mt-8 justify-center">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => handleSuggestionClick(suggestion)}
                className="rounded-full hover-elevate"
                data-testid={`button-suggestion-${index}`}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-8">
          <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
            <div className="space-y-6" data-testid="team-leader-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  data-testid={`message-container-${message.id}`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="w-8 h-8 mr-3 mt-1">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                        AI
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-5 py-4 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border shadow-sm"
                    }`}
                    data-testid={`message-${message.role}-${message.id}`}
                  >
                    {message.role === "assistant" ? (
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm">{message.content}</p>
                        {message.mentionedMembers && message.mentionedMembers.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-primary-foreground/20">
                            {message.mentionedMembers.map(memberId => {
                              const member = teamMembers.find(m => m.id === memberId);
                              return member ? (
                                <Badge key={memberId} variant="secondary" className="text-xs">
                                  <Users className="w-3 h-3 mr-1" />
                                  {member.name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
              {isStreaming && (
                <div className="flex justify-start" data-testid="team-leader-loading-indicator">
                  <Avatar className="w-8 h-8 mr-3 mt-1">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                      AI
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-card border rounded-2xl px-5 py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <Card className="mt-6 border-2">
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything about your team..."
                    className="w-full min-h-[80px] px-4 py-3 text-base bg-background border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="input-team-leader-message-chat"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />

                  {attachedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {attachedFiles.map(file => (
                        <Badge key={file.id} variant="secondary" className="gap-2 pl-3 pr-2 py-1" data-testid={`badge-file-chat-${file.id}`}>
                          <span className="text-xs">{file.name} ({formatFileSize(file.size)})</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => removeFile(file.id)}
                            data-testid={`button-remove-file-chat-${file.id}`}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {selectedMembers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedMembers.map(memberId => {
                        const member = teamMembers.find(m => m.id === memberId);
                        return member ? (
                          <Badge key={memberId} variant="outline" className="gap-2 pl-3 pr-2 py-1 bg-blue-50 dark:bg-blue-950" data-testid={`badge-member-chat-${memberId}`}>
                            <Users className="w-3 h-3" />
                            <span className="text-xs">{member.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => toggleMemberSelection(memberId)}
                              data-testid={`button-remove-member-chat-${memberId}`}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Select value={responseMode} onValueChange={setResponseMode}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="precise">Precise</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                      </SelectContent>
                    </Select>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="relative"
                          data-testid="button-select-team-members-chat"
                        >
                          <Users className="w-5 h-5" />
                          {selectedMembers.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {selectedMembers.length}
                            </span>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-72">
                        <DropdownMenuLabel>Select Team Members</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <ScrollArea className="h-64">
                          {teamMembers.map(member => (
                            <DropdownMenuItem
                              key={member.id}
                              className="flex items-start gap-3 p-3 cursor-pointer"
                              onSelect={(e) => {
                                e.preventDefault();
                                toggleMemberSelection(member.id);
                              }}
                              data-testid={`dropdown-member-chat-${member.id}`}
                            >
                              <Checkbox
                                checked={selectedMembers.includes(member.id)}
                                onCheckedChange={() => toggleMemberSelection(member.id)}
                                data-testid={`checkbox-member-chat-${member.id}`}
                              />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{member.name}</div>
                                <div className="text-xs text-muted-foreground">{member.role}</div>
                                <div className="text-xs text-muted-foreground">{member.email}</div>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </ScrollArea>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-attach-file-chat"
                    >
                      <Paperclip className="w-5 h-5" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleVoiceInput}
                      className={isRecording ? "text-red-500" : ""}
                      data-testid="button-voice-input-chat"
                    >
                      <Mic className={`w-5 h-5 ${isRecording ? "animate-pulse" : ""}`} />
                    </Button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={!input.trim() || isStreaming}
                    className="gap-2"
                    data-testid="button-send-message-chat"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
