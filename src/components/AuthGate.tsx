import { useEffect, useState, ReactNode, createContext, useContext } from "react";
import { ensureSupabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const SUPER_ADMIN_EMAIL = "contact@syedrayyan.com";

interface User {
  id: string;
  email: string;
  role?: string;  // Changed from role_id to role
  role_name?: string;
}

interface AuthContextType {
  userId: string | null;
  userEmail: string | null;
  teamUser: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role?: string;
  } | null;
  clearTeamAuth: () => void;
}

const AuthContext = createContext<AuthContextType>({
  userId: null,
  userEmail: null,
  teamUser: null,
  clearTeamAuth: () => {}
});

export const useAuth = () => useContext(AuthContext);

export function AuthGate({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [teamUser, setTeamUser] = useState<any | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [configError, setConfigError] = useState("");

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        const client = ensureSupabase();
        
        // Check current session
        const { data: sessionData, error: sessionError } = await client.auth.getSession();
        
        if (!mounted) return;
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setError(sessionError.message);
          setLoading(false);
          return;
        }
        
        const sessionEmail = sessionData.session?.user?.email ?? null;
        const sessionId = sessionData.session?.user?.id ?? null;
        setSessionEmail(sessionEmail);
        setUserId(sessionId);
        
        // Check for team user in sessionStorage
        try {
          const storedTeamUser = sessionStorage.getItem('teamUser');
          if (storedTeamUser) {
            const parsedUser = JSON.parse(storedTeamUser);
            setTeamUser(parsedUser);
          } else if (sessionId) {
            // If no team user in storage, try to fetch user role from database
            const { data: userData, error: userError } = await client
              .from('users')
              .select('id, email, first_name, last_name, role')
              .eq('id', sessionId)
              .single();
            
            if (!userError && userData) {
              setTeamUser(userData);
            }
          }
        } catch (error) {
          console.error('Failed to parse team user data:', error);
        }
        
        console.log("Current session email:", sessionEmail);
        
        // Set up auth state change listener
        const { data: listener } = client.auth.onAuthStateChange(async (_event, session) => {
          if (!mounted) return;
          
          const newSessionEmail = session?.user?.email ?? null;
          const newSessionId = session?.user?.id ?? null;
          console.log("Auth state changed:", { _event, newSessionEmail });
          setSessionEmail(newSessionEmail);
          setUserId(newSessionId);
          
          // When a user signs in, check for team user in sessionStorage
          if (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION') {
            try {
              const storedTeamUser = sessionStorage.getItem('teamUser');
              if (storedTeamUser) {
                const parsedUser = JSON.parse(storedTeamUser);
                setTeamUser(parsedUser);
              } else if (newSessionId) {
                // If no team user in storage, try to fetch user role from database
                const { data: userData, error: userError } = await client
                  .from('users')
                  .select('id, email, first_name, last_name, role')
                  .eq('id', newSessionId)
                  .single();
                
                if (!userError && userData) {
                  setTeamUser(userData);
                }
              }
            } catch (error) {
              console.error('Error updating team user on auth state change:', error);
            }
          } else if (_event === 'SIGNED_OUT') {
            // Clear team user on sign out
            setTeamUser(null);
            sessionStorage.removeItem('teamUser');
          }
        });
        
        // Always set loading to false after initialization
        setLoading(false);
        
        return () => {
          listener.subscription.unsubscribe();
        };
      } catch (err: any) {
        if (!mounted) return;
        console.error("Auth initialization error:", err);
        setConfigError(err.message || "Failed to initialize authentication");
        setLoading(false);
      }
    };
    
    initializeAuth();
    
    return () => {
      mounted = false;
    };
  }, []);

  const onSignIn = async () => {
    setError("");
    try {
      const client = ensureSupabase();
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        // After successful sign in, fetch user data and store in sessionStorage
        const { data: { user } } = await client.auth.getUser();
        if (user) {
          const { data: userData, error: userError } = await client
            .from('users')
            .select('id, email, first_name, last_name, role')
            .eq('id', user.id)
            .single();
          
          if (!userError && userData) {
            sessionStorage.setItem('teamUser', JSON.stringify(userData));
            setTeamUser(userData);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    }
  };

  const onSignUp = async () => {
    setError("");
    try {
      const client = ensureSupabase();
      const { error } = await client.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            name: email.split('@')[0] // Simple name from email
          }
        }
      });
      
      if (error) {
        setError(error.message);
      } else {
        setError("Check your email for confirmation link");
      }
    } catch (err: any) {
      setError(err.message || "Signup failed");
    }
  };

  const onSignOut = async () => {
    try {
      const client = ensureSupabase();
      await client.auth.signOut();
      setSessionEmail(null);
      setUserId(null);
      setUser(null);
      
      // Clear team auth if exists
      sessionStorage.removeItem('teamUser');
      setTeamUser(null);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass-card p-6 w-full max-w-md space-y-3 text-center">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3"></div>
            <p className="font-semibold">Initializing...</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Setting up authentication system.
          </p>
          <button 
            className="text-xs text-muted-foreground underline"
            onClick={() => setLoading(false)}
          >
            Skip initialization
          </button>
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass-card p-6 w-full max-w-md space-y-3 text-center">
          <p className="font-semibold">Configuration Error</p>
          <p className="text-sm text-destructive">{configError}</p>
          <p className="text-xs text-muted-foreground">
            Check your Supabase configuration.
          </p>
        </div>
      </div>
    );
  }

  // If neither Supabase user nor team user is authenticated
  if (!sessionEmail && !teamUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass-card p-6 w-full max-w-md space-y-4">
          <div>
            <h1 className="text-xl font-semibold">Authentication</h1>
            <p className="text-sm text-muted-foreground">
              Sign in or sign up with super admin credentials.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              className="w-full h-10 px-3 rounded-md border border-border bg-card"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              className="w-full h-10 px-3 rounded-md border border-border bg-card"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button className="flex-1 rounded-xl" onClick={onSignIn}>
              Sign in
            </Button>
            <Button className="flex-1 rounded-xl" variant="outline" onClick={onSignUp}>
              Sign up
            </Button>
          </div>
          
          {/* Team Login Button */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          
          <a href="/team/auth">
            <Button variant="outline" className="w-full rounded-xl">
              Team Login
            </Button>
          </a>
        </div>
      </div>
    );
  }

  // For testing purposes, allow any authenticated user
  // In production, uncomment the authorization check below
  console.log("Allowing access for:", sessionEmail);
  
  const clearTeamAuth = () => {
    sessionStorage.removeItem('teamUser');
    setTeamUser(null);
  };
  
  // Ensure all context values are properly defined
  const authContextValue: AuthContextType = {
    userId: userId || null,
    userEmail: sessionEmail || null,
    teamUser: teamUser || null,
    clearTeamAuth
  };
  
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
  
  /*
  // Check if user is super admin (uncomment for production)
  const isSuperAdmin = sessionEmail === SUPER_ADMIN_EMAIL;
  
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass-card p-6 w-full max-w-md space-y-3 text-center">
          <p className="font-semibold">Unauthorized</p>
          <p className="text-sm text-muted-foreground">
            This account is not authorized. Please sign in with the super-admin email.
          </p>
          <Button variant="outline" className="w-full" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
  */
}