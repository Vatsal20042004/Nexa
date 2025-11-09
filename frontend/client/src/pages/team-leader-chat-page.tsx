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
import ReactMarkdown from "remark-gfm";
import { useQuery } from "@tanstack/react-query";
import { API_CONFIG } from "@/lib/api-config";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  mentioned_members?: number[];
}

interface TeamMember {
  id: number;
  member_user_id: number;
  name: string;
  role: string;
  email: string;
}

const suggestions = [
  "Show me today's team summary",
  "Who's falling behind this week?",
  "What are the top risks for the next sprint?",
  "Suggest workload rebalancing",
  "Generate weekly report"
];

export default function TeamLeaderChatPage() {
  const setTopbar = useTopbarStore((state) => state.setTopbar);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [responseMode, setResponseMode] = useState("precise");
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setTopbar("Team Leader AI Chat", "Collaborate and manage your team with AI assistance");
  }, [setTopbar]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

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

  useEffect(() => {
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
        toast.error("Voice input failed. Please try again.");
      };
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, []);

  const toggleMemberSelection = (memberId: number) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      mentioned_members: selectedMembers,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    const currentMembers = [...selectedMembers];
    setSelectedMembers([]);
    setIsStreaming(true);

    try {
      const token = localStorage.getItem("session_token") || localStorage.getItem("token");
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/team-leader/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: currentInput,
          mentioned_members: currentMembers,
          response_mode: responseMode,
          session_id: sessionId || undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      
      if (!sessionId) {
        setSessionId(data.session_id);
      }

      // Stream the response word by word
      const words = data.response.split(" ");
      let currentText = "";
      const messageId = (Date.now() + 1).toString();
      
      setMessages((prev) => [...prev, { id: messageId, role: "assistant", content: "" }]);

      for (let i = 0; i < words.length; i++) {
        currentText += (i > 0 ? " " : "") + words[i];
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, content: currentText } : msg
          )
        );
        await new Promise((resolve) => setTimeout(resolve, 30));
      }

      if (currentMembers.length > 0) {
        toast.success(`Context from ${currentMembers.length} team member(s) included`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
      setMessages((prev) => prev.filter(msg => msg.id !== userMessage.id));
      setInput(currentInput);
      setSelectedMembers(currentMembers);
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
      toast.error("Voice input is not supported in your browser.");
      return;
    }
    try {
      if (isRecording) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start();
        setIsRecording(true);
        toast.info("Listening...");
      }
    } catch (error) {
      toast.error("Failed to start voice input");
      setIsRecording(false);
    }
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
            <h1 className="text-4xl font-bold text-foreground">
              {getGreeting()}, Team Leader
            </h1>
            <p className="text-xl text-muted-foreground">
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  
                  {selectedMembers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedMembers.map(memberId => {
                        const member = teamMembers.find(m => m.member_user_id === memberId);
                        return member ? (
                          <Badge key={memberId} variant="outline" className="gap-2 pl-3 pr-2 py-1 bg-blue-50 dark:bg-blue-950">
                            <Users className="w-3 h-3" />
                            <span className="text-xs">{member.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => toggleMemberSelection(memberId)}
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
                      <SelectTrigger className="w-40">
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
                                toggleMemberSelection(member.member_user_id);
                              }}
                            >
                              <Checkbox
                                checked={selectedMembers.includes(member.member_user_id)}
                                onCheckedChange={() => toggleMemberSelection(member.member_user_id)}
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
                      onClick={handleVoiceInput}
                      className={isRecording ? "text-red-500" : ""}
                    >
                      <Mic className={`w-5 h-5 ${isRecording ? "animate-pulse" : ""}`} />
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    disabled={!input.trim() || isStreaming}
                    className="gap-2"
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
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-8">
          <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
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
                  >
                    {message.role === "assistant" ? (
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {message.content}
                      </div>
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.mentioned_members && message.mentioned_members.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-primary-foreground/20">
                            {message.mentioned_members.map(memberId => {
                              const member = teamMembers.find(m => m.member_user_id === memberId);
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
                <div className="flex justify-start">
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />

                  {selectedMembers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedMembers.map(memberId => {
                        const member = teamMembers.find(m => m.member_user_id === memberId);
                        return member ? (
                          <Badge key={memberId} variant="outline" className="gap-2 pl-3 pr-2 py-1 bg-blue-50 dark:bg-blue-950">
                            <Users className="w-3 h-3" />
                            <span className="text-xs">{member.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => toggleMemberSelection(memberId)}
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
                        <Button type="button" variant="outline" size="icon" className="relative">
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
                                toggleMemberSelection(member.member_user_id);
                              }}
                            >
                              <Checkbox
                                checked={selectedMembers.includes(member.member_user_id)}
                                onCheckedChange={() => toggleMemberSelection(member.member_user_id)}
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
                      onClick={handleVoiceInput}
                      className={isRecording ? "text-red-500" : ""}
                    >
                      <Mic className={`w-5 h-5 ${isRecording ? "animate-pulse" : ""}`} />
                    </Button>
                  </div>

                  <Button type="submit" disabled={!input.trim() || isStreaming} className="gap-2">
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
