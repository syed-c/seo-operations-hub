import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Plus, Trash2, Edit3 } from "lucide-react";
import { supabase, ensureSupabase } from "@/lib/supabaseClient";
import { createUser, updateUser, deleteUser } from "@/lib/adminApiClient"; // Import admin functions
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;  // Changed from role_id to role
  role_name?: string;
  avatar_url?: string;
  created_at: string;
}

interface Role {
  id: string;
  name: string;
}

export default function Team() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRoleId, setEditRoleId] = useState("");

  const loadRoles = async () => {
    try {
      const { data, error } = await supabase
        .from("roles")
        .select("id, name")
        .order("name", { ascending: true });
      
      if (error) {
        setError(error.message);
        return;
      }
      
      setRoles(data || []);
      if (data && data.length > 0 && !roleId) {
        setRoleId(data[0].id); // Set default role only if no role is already selected
      }
    } catch (err: any) {
      setError(err.message || "Failed to load roles");
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Try to fetch users with avatar_url column
      const { data, error } = await supabase
        .from("users")
        .select(`
          id, 
          email, 
          first_name,
          last_name,
          role, 
          avatar_url, 
          created_at,
          roles (name)
        `)
        .order("created_at", { ascending: false });
      
      if (error && error.message.includes("avatar_url")) {
        // If avatar_url column doesn't exist, fetch without it
        console.warn("avatar_url column not found, fetching without it");
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("users")
          .select(`
            id, 
            email, 
            first_name,
            last_name,
            role, 
            created_at,
            roles (name)
          `)
          .order("created_at", { ascending: false });
        
        setLoading(false);
        
        if (fallbackError) {
          setError(fallbackError.message);
          return;
        }
        
        // Transform the data without avatar_url
        const transformedData = (fallbackData || []).map((user: any) => ({
          id: user.id,
          email: user.email,
          first_name: user.first_name || undefined,
          last_name: user.last_name || undefined,
          role: user.role || undefined,
          role_name: user.roles?.name || "No role",
          avatar_url: undefined,
          created_at: user.created_at,
        }));
        
        setUsers(transformedData);
        return;
      }
      
      setLoading(false);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      // Transform the data with avatar_url
      const transformedData = (data || []).map((user: any) => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name || undefined,
        last_name: user.last_name || undefined,
        role: user.role || undefined,
        role_name: user.roles?.name || "No role",
        avatar_url: user.avatar_url || undefined,
        created_at: user.created_at,
      }));
      
      setUsers(transformedData);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to load users");
    }
  };

  useEffect(() => {
    loadRoles();
    loadUsers();
  }, []);

  // Use secure admin API client for user operations
  const onCreate = async () => {
    if (!email) return;
    
    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Use secure admin API instead of direct database access
    await createUser({
      email,
      first_name: firstName || null,
      last_name: lastName || null,
      role: roleId || null,  // Changed from role_id to role
    });
    
    setName("");
    setEmail("");
    loadUsers();
  };

  const onDelete = async (id: string) => {
    try {
      // Use secure admin API instead of direct database access
      await deleteUser(id);
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Failed to delete user");
    }
  };

  const startEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditName(`${user.first_name || ''} ${user.last_name || ''}`.trim());
    setEditRoleId(user.role || "");  // Changed from user.role_id to user.role
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditName("");
    setEditRoleId("");
  };

  const saveEdit = async (userId: string) => {
    try {
      // Split name into first and last name
      const nameParts = editName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Use secure admin API instead of direct database access
      await updateUser({
        id: userId,
        first_name: firstName || null,
        last_name: lastName || null,
        role: editRoleId || null,  // Changed from role_id to role
      });
      setEditingUserId(null);
      setEditName("");
      setEditRoleId("");
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Failed to update user");
    }
  };

  return (
    <MainLayout>
      <Header title="Team" subtitle="Assign owners, view roles, and capacities" />
      
      <div className="flex items-center gap-3 mb-6">
        <input
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
        >
          {roles.map(role => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
        </select>
        <Button className="gap-2 rounded-xl" onClick={onCreate}>
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>
      
      {loading && <p className="text-sm text-muted-foreground mb-4">Loading...</p>}
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {users.map((user) => (
          <Card
            key={user.id}
            className="glass-card animate-slide-up hover:shadow-card-hover transition-all"
          >
            {editingUserId === user.id ? (
              // Edit mode
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <input
                      className="font-semibold bg-transparent border-b border-primary outline-none"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 px-2"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => saveEdit(user.id)}
                    >
                      Save
                    </Button>
                  </div>
                </div>
                <select
                  className="w-full rounded-lg border border-border bg-card px-2 py-1 text-sm"
                  value={editRoleId}
                  onChange={(e) => setEditRoleId(e.target.value)}
                >
                  <option value="">No role</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </CardHeader>
            ) : (
              // View mode
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm">{`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                      onClick={() => startEdit(user)}
                    >
                      <Edit3 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                      onClick={() => onDelete(user.id)}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{user.role_name}</p>
              </CardHeader>
            )}
            <CardContent className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback>{(user.first_name ? user.first_name.charAt(0) : '') + (user.last_name ? user.last_name.charAt(0) : user.email.charAt(0))}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  Joined: {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}

const transformUser = (user: any) => {
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
  const initials = (user.first_name ? user.first_name.charAt(0) : '') + (user.last_name ? user.last_name.charAt(0) : user.email.charAt(0));
  
  return {
    ...user,
    name: fullName,
    initials: initials
  };
}
