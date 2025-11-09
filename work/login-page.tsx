import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password })
      // });
      // const user = await response.json();

      // Dummy authentication for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if team leader (dummy check)
      if (email.includes("leader")) {
        localStorage.setItem("userRole", "team_leader");
        localStorage.setItem("user", JSON.stringify({ email, name: "Team Leader", role: "team_leader" }));
        toast.success("Welcome, Team Leader!");
        setLocation("/team-leader");
      } else {
        localStorage.setItem("userRole", "employee");
        localStorage.setItem("user", JSON.stringify({ email, name: "Employee", role: "employee" }));
        toast.success("Welcome!");
        setLocation("/");
      }
    } catch (error) {
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl">Work Console</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Tip: Use "leader" in email for team leader access
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              <p>Demo credentials:</p>
              <p className="font-mono text-xs mt-1">
                Employee: employee@company.com<br />
                Team Leader: leader@company.com
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
