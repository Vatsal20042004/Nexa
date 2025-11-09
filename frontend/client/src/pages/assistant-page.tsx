import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Mic, Paperclip, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTopbarStore } from "@/lib/store/topbar-store";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

const suggestions = [
  "What tasks do I have today?",
  "Help me plan my week",
  "Show my recent activity",
  "What should I focus on?",
  "Review my progress"
];

// API configuration
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function AssistantPage() {
  const setTopbar = useTopbarStore((state) => state.setTopbar);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [responseMode, setResponseMode] = useState("precise");
  const [sessionId, setSessionId] = useState<string>("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setTopbar("AI Assistant", "Your intelligent productivity companion");
    // Generate unique session ID
    setSessionId(`chat_${Date.now()}`);
  }, [setTopbar]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Initialize Web Speech API
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

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachedFiles([]);
    setIsStreaming(true);

    try {
      // Get session token
      const sessionToken = localStorage.getItem("session_token") || localStorage.getItem("token");
      
      if (!sessionToken) {
        toast.error("Please login to use the assistant");
        setIsStreaming(false);
        return;
      }

      // Call backend API
      const response = await fetch(`${API_URL}/api/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: input.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to get response");
      }

      const data = await response.json();
      
      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
    } catch (error: any) {
      console.error("Chat error:", error);
      toast.error(error.message || "Failed to send message");
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error processing your request. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
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

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: AttachedFile[] = files.map(file => ({
      id: Date.now().toString() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type
    }));
    setAttachedFiles(prev => [...prev, ...newFiles]);
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
            <h1 className="text-4xl font-bold text-foreground" data-testid="text-assistant-greeting">
              {getGreeting()}, User
            </h1>
            <p className="text-xl text-muted-foreground" data-testid="text-assistant-subtitle">
              What can I help you with today?
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
                    placeholder="Ask anything"
                    className="w-full min-h-[120px] px-4 py-3 text-base bg-background border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="input-assistant-message"
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
            <div className="space-y-6" data-testid="assistant-messages">
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
                      <p className="text-sm">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isStreaming && (
                <div className="flex justify-start" data-testid="assistant-loading-indicator">
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
                    placeholder="Ask anything"
                    className="w-full min-h-[80px] px-4 py-3 text-base bg-background border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="input-assistant-message-chat"
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
