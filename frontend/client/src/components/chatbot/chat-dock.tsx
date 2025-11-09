import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUIStore } from "@/lib/store/ui-store";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ChatDock() {
  const { setIsChatOpen } = useUIStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI assistant. I can help you manage tasks, understand your schedule, and answer questions about your projects. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    const responses = [
      "I understand you're working on that task. Based on your calendar, you have a meeting scheduled in 2 hours. Would you like me to help you prepare?",
      "I've analyzed your task list and found 3 high-priority items due this week. Would you like me to create a focused plan for completing them?",
      "Great question! Based on your project timeline, I recommend focusing on the design phase first, then moving to implementation. This approach aligns with your team's availability.",
      "I can help with that. Let me check your schedule and suggest the best time slots for this task based on your working hours and existing commitments.",
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    await simulateStreaming(randomResponse);
    setIsStreaming(false);
  };

  return (
    <div
      className="w-96 bg-card border-l border-card-border flex flex-col h-screen animate-in slide-in-from-right duration-200"
      data-testid="chat-dock"
    >
      <div className="h-16 border-b border-border px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              AI
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-foreground" data-testid="text-chat-title">
              AI Assistant
            </h3>
            <p className="text-xs text-muted-foreground">Always here to help</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsChatOpen(false)}
          data-testid="button-close-chat"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
        <div className="space-y-4" data-testid="chat-messages">
          {messages.length === 0 && !isStreaming ? (
            <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-state-chat">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2" data-testid="text-empty-chat-title">Start a conversation</h3>
              <p className="text-sm text-muted-foreground" data-testid="text-empty-chat-message">
                Ask me anything about your tasks, projects, or schedule!
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  data-testid={`message-container-${message.id}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
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
                <div className="flex justify-start" data-testid="chat-loading-indicator">
                  <div className="bg-muted text-muted-foreground rounded-2xl px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isStreaming}
            className="flex-1"
            data-testid="input-chat-message"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isStreaming}
            data-testid="button-send-message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
