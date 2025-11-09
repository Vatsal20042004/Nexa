import { useEffect } from "react";
import { useLocation } from "wouter";

export default function ClearStorage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Clear all localStorage
    localStorage.clear();
    
    // Show confirmation
    alert("LocalStorage cleared! You will now be redirected to login.");
    
    // Redirect to login
    setLocation("/login");
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Clearing Storage...</h1>
        <p>Please wait...</p>
      </div>
    </div>
  );
}
