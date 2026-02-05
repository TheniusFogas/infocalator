import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Megaphone, 
  Link2, 
  Save, 
  Loader2,
  Plus,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';

interface AdZone {
  id: string;
  name: string;
  zone_key: string;
  ad_type: string;
  ad_code: string | null;
  is_active: boolean;
  placement: string | null;
}

interface AffiliateLink {
  id: string;
  platform: string;
  base_url: string;
  affiliate_id: string | null;
  tracking_params: string | null;
  is_active: boolean;
  priority: number;
}

interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  setting_type: string;
  description: string | null;
}

const AdminPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [adZones, setAdZones] = useState<AdZone[]>([]);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [settings, setSettings] = useState<SiteSetting[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      setUser(session.user);

       // Server-side admin verification
       try {
         const { data, error } = await supabase.functions.invoke('verify-admin');
         
         if (!error && data?.isAdmin) {
           setIsAdmin(true);
           await fetchData();
         }
       } catch (err) {
         console.error('Admin verification error:', err);
      }
      
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        
         // Server-side admin verification
         try {
           const { data, error } = await supabase.functions.invoke('verify-admin');
           
           if (!error && data?.isAdmin) {
             setIsAdmin(true);
             await fetchData();
           }
         } catch (err) {
           console.error('Admin verification error:', err);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    const [adsRes, linksRes, settingsRes] = await Promise.all([
      supabase.from('ad_zones').select('*').order('placement'),
      supabase.from('affiliate_links').select('*').order('priority', { ascending: false }),
      supabase.from('site_settings').select('*').order('setting_key'),
    ]);

    if (adsRes.data) setAdZones(adsRes.data);
    if (linksRes.data) setAffiliateLinks(linksRes.data);
    if (settingsRes.data) setSettings(settingsRes.data);
  };

  const handleGoogleLogin = async () => {
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin + '/admin',
    });
    
    if (error) {
      toast.error('Eroare la autentificare');
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  const updateAdZone = async (id: string, updates: Partial<AdZone>) => {
    setSaving(true);
    const { error } = await supabase
      .from('ad_zones')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Eroare la salvare');
    } else {
      setAdZones(zones => zones.map(z => z.id === id ? { ...z, ...updates } : z));
      toast.success('Salvat cu succes');
    }
    setSaving(false);
  };

  const updateAffiliateLink = async (id: string, updates: Partial<AffiliateLink>) => {
    setSaving(true);
    const { error } = await supabase
      .from('affiliate_links')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Eroare la salvare');
    } else {
      setAffiliateLinks(links => links.map(l => l.id === id ? { ...l, ...updates } : l));
      toast.success('Salvat cu succes');
    }
    setSaving(false);
  };

  const updateSetting = async (key: string, value: string) => {
    setSaving(true);
    const { error } = await supabase
      .from('site_settings')
      .update({ setting_value: value })
      .eq('setting_key', key);

    if (error) {
      toast.error('Eroare la salvare');
    } else {
      setSettings(s => s.map(setting => 
        setting.setting_key === key ? { ...setting, setting_value: value } : setting
      ));
      toast.success('Salvat cu succes');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Panou Administrare</CardTitle>
              <CardDescription>Autentifică-te pentru a accesa panoul de administrare</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleGoogleLogin} className="w-full gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Autentificare cu Google
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Acces restricționat</CardTitle>
              <CardDescription>
                Contul tău ({user.email}) nu are permisiuni de administrator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={handleLogout}>
                Deconectare
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Panou Administrare</h1>
            <p className="text-muted-foreground">Gestionează reclamele și link-urile afiliate</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Deconectare
            </Button>
          </div>
        </div>

        <Tabs defaultValue="ads" className="space-y-6">
          <TabsList>
            <TabsTrigger value="ads" className="gap-2">
              <Megaphone className="w-4 h-4" />
              Zone Publicitate
            </TabsTrigger>
            <TabsTrigger value="affiliates" className="gap-2">
              <Link2 className="w-4 h-4" />
              Link-uri Afiliate
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Setări
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Zone de Publicitate Google AdSense</CardTitle>
                <CardDescription>
                  Adaugă codul AdSense pentru fiecare zonă. Activează zonele pe care dorești să le afișezi.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {adZones.map((zone) => (
                  <div key={zone.id} className="p-4 border border-border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">{zone.name}</h4>
                        <p className="text-sm text-muted-foreground">Plasare: {zone.placement}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`active-${zone.id}`} className="text-sm">
                          {zone.is_active ? 'Activ' : 'Inactiv'}
                        </Label>
                        <Switch
                          id={`active-${zone.id}`}
                          checked={zone.is_active}
                          onCheckedChange={(checked) => updateAdZone(zone.id, { is_active: checked })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`code-${zone.id}`}>Cod AdSense</Label>
                      <Textarea
                        id={`code-${zone.id}`}
                        placeholder="<script async src='https://pagead2.googlesyndication.com/...'></script>"
                        value={zone.ad_code || ''}
                        onChange={(e) => setAdZones(zones => 
                          zones.map(z => z.id === zone.id ? { ...z, ad_code: e.target.value } : z)
                        )}
                        className="font-mono text-sm"
                        rows={3}
                      />
                      <Button 
                        size="sm" 
                        className="mt-2"
                        onClick={() => updateAdZone(zone.id, { ad_code: zone.ad_code })}
                        disabled={saving}
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvează
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="affiliates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Link-uri Afiliate pentru Rezervări</CardTitle>
                <CardDescription>
                  Configurează ID-urile de afiliat pentru fiecare platformă de rezervări.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {affiliateLinks.map((link) => (
                  <div key={link.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-foreground">{link.platform}</h4>
                        <Badge variant={link.is_active ? 'default' : 'secondary'}>
                          {link.is_active ? 'Activ' : 'Inactiv'}
                        </Badge>
                      </div>
                      <Switch
                        checked={link.is_active}
                        onCheckedChange={(checked) => updateAffiliateLink(link.id, { is_active: checked })}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>URL Bază</Label>
                        <Input
                          value={link.base_url}
                          onChange={(e) => setAffiliateLinks(links => 
                            links.map(l => l.id === link.id ? { ...l, base_url: e.target.value } : l)
                          )}
                          placeholder="https://www.booking.com/..."
                        />
                      </div>
                      <div>
                        <Label>ID Afiliat</Label>
                        <Input
                          value={link.affiliate_id || ''}
                          onChange={(e) => setAffiliateLinks(links => 
                            links.map(l => l.id === link.id ? { ...l, affiliate_id: e.target.value } : l)
                          )}
                          placeholder="ex: 123456"
                        />
                      </div>
                      <div>
                        <Label>Parametri Tracking</Label>
                        <Input
                          value={link.tracking_params || ''}
                          onChange={(e) => setAffiliateLinks(links => 
                            links.map(l => l.id === link.id ? { ...l, tracking_params: e.target.value } : l)
                          )}
                          placeholder="ex: utm_source=drumbun&utm_medium=affiliate"
                        />
                      </div>
                      <div>
                        <Label>Prioritate</Label>
                        <Input
                          type="number"
                          value={link.priority}
                          onChange={(e) => setAffiliateLinks(links => 
                            links.map(l => l.id === link.id ? { ...l, priority: parseInt(e.target.value) } : l)
                          )}
                        />
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="mt-4"
                      onClick={() => updateAffiliateLink(link.id, {
                        base_url: link.base_url,
                        affiliate_id: link.affiliate_id,
                        tracking_params: link.tracking_params,
                        priority: link.priority,
                      })}
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Salvează
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Setări Generale</CardTitle>
                <CardDescription>
                  Configurează setările generale ale site-ului.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.map((setting) => (
                  <div key={setting.id} className="flex items-start gap-4 p-4 border border-border rounded-lg">
                    <div className="flex-1">
                      <Label htmlFor={setting.setting_key}>{setting.setting_key}</Label>
                      <p className="text-sm text-muted-foreground mb-2">{setting.description}</p>
                      {setting.setting_type === 'boolean' ? (
                        <Switch
                          id={setting.setting_key}
                          checked={setting.setting_value === 'true'}
                          onCheckedChange={(checked) => updateSetting(setting.setting_key, checked.toString())}
                        />
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            id={setting.setting_key}
                            value={setting.setting_value || ''}
                            onChange={(e) => setSettings(s => 
                              s.map(set => set.setting_key === setting.setting_key 
                                ? { ...set, setting_value: e.target.value } 
                                : set
                              )
                            )}
                            type={setting.setting_type === 'number' ? 'number' : 'text'}
                          />
                          <Button 
                            size="sm"
                            onClick={() => updateSetting(setting.setting_key, setting.setting_value || '')}
                            disabled={saving}
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default AdminPage;
