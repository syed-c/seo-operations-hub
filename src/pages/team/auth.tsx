import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { teamLogin } from "@/lib/auth/teamAuth";
import { useToast } from "@/hooks/use-toast";
import { isLockedOut, getTimeUntilUnlock, recordLoginAttempt, clearLoginAttempts } from "@/lib/auth/loginAttempts";

export default function TeamAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lockedOut, setLockedOut] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is locked out on component mount and when email changes
  useEffect(() => {
    if (email) {
      const isLocked = isLockedOut(email);
      setLockedOut(isLocked);
      
      if (isLocked) {
        const timeUntilUnlock = getTimeUntilUnlock(email);
        setLockoutTime(timeUntilUnlock);
        
        // Update countdown timer
        const timer = setInterval(() => {
          setLockoutTime(prev => {
            if (prev <= 1000) {
              clearInterval(timer);
              setLockedOut(false);
              return 0;
            }
            return prev - 1000;
          });
        }, 1000);
        
        return () => clearInterval(timer);
      }
    }
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is locked out
    if (isLockedOut(email)) {
      setError("Too many failed attempts. Please try again later.");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const result = await teamLogin(email, password);
      
      if (result.success) {
        // Record successful login attempt
        recordLoginAttempt(email, true);
        
        // Clear previous failed attempts
        clearLoginAttempts(email);
        
        // Show success message
        toast({
          title: "Login Successful",
          description: "Welcome back! Redirecting to dashboard...",
        });
        
        // Store user data in sessionStorage or localStorage
        sessionStorage.setItem('teamUser', JSON.stringify(result.user));
        
        // Redirect based on role (simplified for now)
        navigate("/");
      } else {
        // Record failed login attempt
        recordLoginAttempt(email, false);
        
        // Check if user is now locked out
        if (isLockedOut(email)) {
          setLockedOut(true);
          const timeUntilUnlock = getTimeUntilUnlock(email);
          setLockoutTime(timeUntilUnlock);
          setError("Too many failed attempts. Please try again later.");
          
          // Update countdown timer
          const timer = setInterval(() => {
            setLockoutTime(prev => {
              if (prev <= 1000) {
                clearInterval(timer);
                setLockedOut(false);
                return 0;
              }
              return prev - 1000;
            });
          }, 1000);
        } else {
          setError(result.error || "Login failed");
        }
      }
    } catch (err) {
      // Record failed login attempt
      recordLoginAttempt(email, false);
      setError("An unexpected error occurred");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="glass-card p-6 w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Team Login</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in to your team account
          </p>
        </div>

        {error && !lockedOut && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        
        {lockedOut && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            Too many failed attempts. Please try again in {Math.ceil(lockoutTime / 60000)} minute(s).
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full h-10 px-3 rounded-md border border-border bg-card"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full h-10 px-3 rounded-md border border-border bg-card"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full rounded-xl" 
            disabled={loading || lockedOut}
          >
            {loading ? "Signing in..." : lockedOut ? `Locked (${Math.ceil(lockoutTime / 60000)} min)` : "Sign In"}
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link 
            to="/" 
            className="text-primary hover:underline"
          >
            Back to main login
          </Link>
        </div>
      </div>
    </div>
  );
}