import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  Bell,
  Save
} from "lucide-react";

interface NotificationChannel {
  id: string;
  user_id: string;
  channel_type: 'email' | 'slack' | 'whatsapp' | 'in_app';
  channel_identifier: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export default function NotificationSettings() {
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form states for each channel type
  const [email, setEmail] = useState({ enabled: true, identifier: '' });
  const [slack, setSlack] = useState({ enabled: false, identifier: '' });
  const [whatsapp, setWhatsapp] = useState({ enabled: false, identifier: '' });
  const [inApp, setInApp] = useState({ enabled: true, identifier: '' });

  const loadChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_channels')
        .select('*')
        .order('channel_type');
      
      if (error) {
        toast.error('Failed to load notification settings', {
          description: error.message
        });
        return;
      }
      
      setChannels(data || []);
      
      // Initialize form states
      data?.forEach(channel => {
        switch (channel.channel_type) {
          case 'email':
            setEmail({ enabled: channel.is_enabled, identifier: channel.channel_identifier });
            break;
          case 'slack':
            setSlack({ enabled: channel.is_enabled, identifier: channel.channel_identifier });
            break;
          case 'whatsapp':
            setWhatsapp({ enabled: channel.is_enabled, identifier: channel.channel_identifier });
            break;
          case 'in_app':
            setInApp({ enabled: channel.is_enabled, identifier: channel.channel_identifier });
            break;
        }
      });
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  const saveChannels = async () => {
    setSaving(true);
    try {
      // Prepare data for upsert
      const channelsToUpdate = [
        { channel_type: 'email', is_enabled: email.enabled, channel_identifier: email.identifier },
        { channel_type: 'slack', is_enabled: slack.enabled, channel_identifier: slack.identifier },
        { channel_type: 'whatsapp', is_enabled: whatsapp.enabled, channel_identifier: whatsapp.identifier },
        { channel_type: 'in_app', is_enabled: inApp.enabled, channel_identifier: inApp.identifier },
      ];

      // Upsert each channel
      for (const channel of channelsToUpdate) {
        const { error } = await supabase
          .from('notification_channels')
          .upsert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            channel_type: channel.channel_type,
            channel_identifier: channel.channel_identifier,
            is_enabled: channel.is_enabled,
          }, {
            onConflict: 'user_id,channel_type'
          });
        
        if (error) {
          throw error;
        }
      }
      
      toast.success('Notification settings saved successfully');
      loadChannels(); // Reload to get updated data
    } catch (err: any) {
      console.error('Error saving channels:', err);
      toast.error('Failed to save notification settings', {
        description: err.message
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Header title="Notification Settings" subtitle="Configure how you receive notifications" />
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p>Loading notification settings...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Header title="Notification Settings" subtitle="Configure how you receive notifications" />
      
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose how you want to receive notifications for important events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Channel */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Input
                  placeholder="your@email.com"
                  value={email.identifier}
                  onChange={(e) => setEmail({...email, identifier: e.target.value})}
                  className="w-64"
                />
                <Switch
                  checked={email.enabled}
                  onCheckedChange={(checked) => setEmail({...email, enabled: checked})}
                />
              </div>
            </div>
            
            {/* Slack Channel */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">Slack Notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive notifications in Slack</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Webhook URL"
                  value={slack.identifier}
                  onChange={(e) => setSlack({...slack, identifier: e.target.value})}
                  className="w-64"
                />
                <Switch
                  checked={slack.enabled}
                  onCheckedChange={(checked) => setSlack({...slack, enabled: checked})}
                />
              </div>
            </div>
            
            {/* WhatsApp Channel */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">WhatsApp Notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive notifications via WhatsApp</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Input
                  placeholder="+1 (555) 123-4567"
                  value={whatsapp.identifier}
                  onChange={(e) => setWhatsapp({...whatsapp, identifier: e.target.value})}
                  className="w-64"
                />
                <Switch
                  checked={whatsapp.enabled}
                  onCheckedChange={(checked) => setWhatsapp({...whatsapp, enabled: checked})}
                />
              </div>
            </div>
            
            {/* In-App Channel */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium">In-App Notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive notifications in the app</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-64 text-right text-sm text-muted-foreground">
                  Always enabled
                </div>
                <Switch
                  checked={inApp.enabled}
                  onCheckedChange={(checked) => setInApp({...inApp, enabled: checked})}
                />
              </div>
            </div>
            
            <div className="pt-4">
              <Button 
                onClick={saveChannels} 
                disabled={saving}
                className="w-full sm:w-auto"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Notification Settings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Notification Types</CardTitle>
            <CardDescription>
              Configure which types of notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Ranking Drops</h4>
                  <p className="text-sm text-muted-foreground">Get notified when keyword rankings drop significantly</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Task Blocked</h4>
                  <p className="text-sm text-muted-foreground">Get notified when tasks are blocked for more than 2 days</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">SEO Issues Detected</h4>
                  <p className="text-sm text-muted-foreground">Get notified when new SEO issues are detected</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Weekly Reports</h4>
                  <p className="text-sm text-muted-foreground">Get notified when weekly reports are ready</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Team Mentions</h4>
                  <p className="text-sm text-muted-foreground">Get notified when you're mentioned in team chat</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}