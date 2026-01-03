import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Plus, Trash2, Edit3 } from "lucide-react";
import { supabase, ensureSupabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  role_name?: string;
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form state for new user
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Form state for editing user
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editRole, setEditRole] = useState("");

  const loadRoles = async () => {
    // Load predefined roles from the PRODUCTION_GUIDE.md
    const predefinedRoles = [
      { id: 'super_admin', name: 'Super Admin' },
      { id: 'admin', name: 'Admin' },
      { id: 'seo_lead', name: 'SEO Lead' },
      { id: 'content_lead', name: 'Content Lead' },
      { id: 'backlink_lead', name: 'Backlink Lead' },
      { id: 'developer', name: 'Developer' },
      { id: 'designer', name: 'Designer' },
      { id: 'client', name: 'Client' },
      { id: 'viewer', name: 'Viewer' }
    ];
    
    setRoles(predefinedRoles);
    if (predefinedRoles.length > 0 && !selectedRole) {
      setSelectedRole(predefinedRoles[0].name);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const adminApiClient = await import('@/lib/adminApiClient');
      const result = await adminApiClient.selectRecords('users', `
        id, 
        email, 
        first_name,
        last_name,
        role, 
        created_at
      `);
      
      setLoading(false);
      
      if (result?.error) {
        console.error("Error loading users:", result.error);
        return;
      }
      
      const transformedData = (result?.data || []).map((user: any) => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name || undefined,
        last_name: user.last_name || undefined,
        role: user.role || undefined,
        role_name: user.role || "No role",
        created_at: user.created_at,
      }));
      
      setUsers(transformedData);
    } catch (err: any) {
      setLoading(false);
      console.error("Error:", err);
    }
  };

  useEffect(() => {
    loadRoles();
    loadUsers();
  }, []);

  const onCreate = async () => {
    if (!email) {
      toast({
        title: "Validation Error",
        description: "Email is required",
        variant: "destructive"
      });
      return;
    }

    // Password validation
    if (password && password.length < 8) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    if (password && password !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    try {
      // First, create the auth user using the secure admin Edge Function
      const adminApiClient1 = await import('@/lib/adminApiClient');
      
      // Create auth user via admin function
      const authUserData: any = {
        email,
        email_confirm: true, // Auto-confirm email for admin-created users
        user_metadata: {
          first_name: firstName || null,
          last_name: lastName || null,
        }
      };
      
      // Only add password if it's provided to avoid null/undefined issues
      if (password) {
        authUserData.password = password;
      }
      
      const { data: authResult } = await adminApiClient1.createRecord('auth_user', authUserData);
      
      if (!authResult || authResult.length === 0) {
        throw new Error('Failed to create auth user');
      }
      
      const userId = authResult[0].id;
      
      // Now create the entry in the custom users table using admin function
      let newUser;
      try {
        newUser = await adminApiClient1.createRecord('users', {
          id: userId,
          email,
          first_name: firstName || null,
          last_name: lastName || null,
          role: selectedRole || null,
        });
      } catch (insertError: any) {
        // If custom user creation fails, delete the auth user we just created
        try {
          await adminApiClient1.deleteRecords('auth_user', { id: userId });
        } catch (deleteError) {
          console.error('Failed to clean up auth user after creation failure:', deleteError);
        }
        throw new Error(insertError.message || 'Failed to create user in database');
      }
      
      console.log('Create user result:', newUser);
      
      toast({
        title: "Success",
        description: "Team member added successfully!",
      });
      
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setDialogOpen(false);
      loadUsers();
    } catch (err: any) {
      console.error('Create user error:', err);
      // Check if it's an email exists error and provide appropriate message
      const errorMessage = err.message?.includes('email_exists') || err.message?.includes('A user with this email already exists') 
        ? 'A user with this email address already exists'
        : err.message || "Failed to add user";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const onDelete = async (id: string) => {
    try {
      // Delete from custom users table first using admin function
      const adminApiClient3 = await import('@/lib/adminApiClient');
      await adminApiClient3.deleteRecords('users', { id });
      
      // Then delete the auth user using the secure admin function
      await adminApiClient3.deleteRecords('auth_user', { id });
      
      toast({
        title: "Deleted",
        description: "Team member removed",
      });
      loadUsers();
    } catch (err: any) {
      console.error('Delete user error:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setEditFirstName(user.first_name || "");
    setEditLastName(user.last_name || "");
    setEditRole(user.role || "");
    setEditDialogOpen(true);
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    
    try {
      const adminApiClient2 = await import('@/lib/adminApiClient');
      await adminApiClient2.updateRecords('users', {
        first_name: editFirstName || null,
        last_name: editLastName || null,
        role: editRole || null,
      }, { id: editingUser.id });
      
      toast({
        title: "Updated",
        description: "Team member updated successfully",
      });
      
      setEditDialogOpen(false);
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update user",
        variant: "destructive"
      });
    }
  };

  return (
    <MainLayout>
      <Header title="Team" subtitle="Assign owners, view roles, and capacities" />
      
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">{users.length} team members</p>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl">
              <Plus className="w-4 h-4" />
              Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Add a new member to your team. They will receive an invitation email.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password (Optional)</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank for no password login"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={onCreate}>
                Add Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {loading && <p className="text-sm text-muted-foreground mb-4">Loading...</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {users.map((user) => (
          <Card
            key={user.id}
            className="glass-card animate-slide-up hover:shadow-card-hover transition-all group"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm">
                    {`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}
                  </CardTitle>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                    onClick={() => startEdit(user)}
                  >
                    <Edit3 className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    className="w-8 h-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center"
                    onClick={() => onDelete(user.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
              <span className="chip chip-primary text-xs w-fit">{user.role_name}</span>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback>
                  {(user.first_name ? user.first_name.charAt(0) : '') + 
                   (user.last_name ? user.last_name.charAt(0) : user.email.charAt(0).toUpperCase())}
                </AvatarFallback>
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update team member information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">First Name</Label>
                <Input
                  id="editFirstName"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Last Name</Label>
                <Input
                  id="editLastName"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}