 import { useState, useEffect } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Badge } from '@/components/ui/badge';
 import { Switch } from '@/components/ui/switch';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Plus, Pencil, Trash2, Loader2, Save, RefreshCw, Database, AlertCircle, CheckCircle } from 'lucide-react';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 
 interface DataSource {
   id: string;
   source_name: string;
   source_type: string;
   source_url: string;
   api_type: string | null;
   api_key_name: string | null;
   is_active: boolean | null;
   refresh_interval_hours: number | null;
   last_sync_at: string | null;
   sync_status: string | null;
   sync_error: string | null;
 }
 
 const SOURCE_TYPES = ['api', 'rss', 'scraper', 'manual'];
 const API_TYPES = ['rest', 'graphql', 'xml'];
 
 export const AdminDataSources = () => {
   const [sources, setSources] = useState<DataSource[]>([]);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [dialogOpen, setDialogOpen] = useState(false);
   const [editingItem, setEditingItem] = useState<DataSource | null>(null);
 
   const [formData, setFormData] = useState({
     source_name: '',
     source_type: '',
     source_url: '',
     api_type: '',
     api_key_name: '',
     is_active: true,
     refresh_interval_hours: '24',
   });
 
   useEffect(() => {
     fetchSources();
   }, []);
 
   const fetchSources = async () => {
     setLoading(true);
     const { data, error } = await supabase
       .from('data_sources')
       .select('*')
       .order('priority', { ascending: false });
 
     if (error) {
       toast.error('Eroare la încărcarea surselor');
     } else {
       setSources(data || []);
     }
     setLoading(false);
   };
 
   const handleEdit = (item: DataSource) => {
     setEditingItem(item);
     setFormData({
       source_name: item.source_name,
       source_type: item.source_type,
       source_url: item.source_url,
       api_type: item.api_type || '',
       api_key_name: item.api_key_name || '',
       is_active: item.is_active ?? true,
       refresh_interval_hours: item.refresh_interval_hours?.toString() || '24',
     });
     setDialogOpen(true);
   };
 
   const handleNew = () => {
     setEditingItem(null);
     setFormData({
       source_name: '',
       source_type: '',
       source_url: '',
       api_type: '',
       api_key_name: '',
       is_active: true,
       refresh_interval_hours: '24',
     });
     setDialogOpen(true);
   };
 
   const handleSave = async () => {
     if (!formData.source_name || !formData.source_type || !formData.source_url) {
       toast.error('Numele, tipul și URL-ul sunt obligatorii');
       return;
     }
 
     setSaving(true);
     const sourceData = {
       source_name: formData.source_name,
       source_type: formData.source_type,
       source_url: formData.source_url,
       api_type: formData.api_type || null,
       api_key_name: formData.api_key_name || null,
       is_active: formData.is_active,
       refresh_interval_hours: parseInt(formData.refresh_interval_hours) || 24,
     };
 
     if (editingItem) {
       const { error } = await supabase
         .from('data_sources')
         .update(sourceData)
         .eq('id', editingItem.id);
 
       if (error) {
         toast.error('Eroare la actualizare');
       } else {
         toast.success('Sursa a fost actualizată');
         setDialogOpen(false);
         fetchSources();
       }
     } else {
       const { error } = await supabase
         .from('data_sources')
         .insert([{ ...sourceData, sync_status: 'pending' }]);
 
       if (error) {
         toast.error('Eroare la adăugare');
       } else {
         toast.success('Sursa a fost adăugată');
         setDialogOpen(false);
         fetchSources();
       }
     }
     setSaving(false);
   };
 
   const handleDelete = async (id: string) => {
     if (!confirm('Sigur dorești să ștergi această sursă de date?')) return;
 
     const { error } = await supabase
       .from('data_sources')
       .delete()
       .eq('id', id);
 
     if (error) {
       toast.error('Eroare la ștergere');
     } else {
       toast.success('Sursa a fost ștearsă');
       fetchSources();
     }
   };
 
   const toggleActive = async (id: string, isActive: boolean) => {
     const { error } = await supabase
       .from('data_sources')
       .update({ is_active: isActive })
       .eq('id', id);
 
     if (error) {
       toast.error('Eroare la actualizare');
     } else {
       setSources(s => s.map(source => source.id === id ? { ...source, is_active: isActive } : source));
     }
   };
 
   const formatDate = (dateString: string | null) => {
     if (!dateString) return '-';
     return new Date(dateString).toLocaleString('ro-RO');
   };
 
   const getStatusBadge = (status: string | null) => {
     switch (status) {
       case 'success':
         return <Badge className="bg-green-500/10 text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Succes</Badge>;
       case 'error':
         return <Badge className="bg-red-500/10 text-red-600"><AlertCircle className="w-3 h-3 mr-1" />Eroare</Badge>;
       case 'pending':
         return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1" />În așteptare</Badge>;
       default:
         return <Badge variant="outline">Necunoscut</Badge>;
     }
   };
 
   if (loading) {
     return (
       <Card>
         <CardContent className="flex items-center justify-center py-8">
           <Loader2 className="w-6 h-6 animate-spin text-primary" />
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card>
       <CardHeader>
         <div className="flex items-center justify-between">
           <div>
             <CardTitle>Surse de Date</CardTitle>
             <CardDescription>Configurează sursele externe pentru popularea automată</CardDescription>
           </div>
           <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
             <DialogTrigger asChild>
               <Button onClick={handleNew}>
                 <Plus className="w-4 h-4 mr-2" />
                 Adaugă Sursă
               </Button>
             </DialogTrigger>
             <DialogContent className="max-w-xl">
               <DialogHeader>
                 <DialogTitle>
                   {editingItem ? 'Editează Sursa' : 'Adaugă Sursă Nouă'}
                 </DialogTitle>
               </DialogHeader>
               <div className="grid gap-4 py-4">
                 <div>
                   <Label htmlFor="source_name">Nume Sursă *</Label>
                   <Input
                     id="source_name"
                     value={formData.source_name}
                     onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
                     placeholder="OpenWeather API"
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="source_type">Tip Sursă *</Label>
                     <Select
                       value={formData.source_type}
                       onValueChange={(value) => setFormData({ ...formData, source_type: value })}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="Tip" />
                       </SelectTrigger>
                       <SelectContent>
                         {SOURCE_TYPES.map(type => (
                           <SelectItem key={type} value={type}>{type.toUpperCase()}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   <div>
                     <Label htmlFor="api_type">Tip API</Label>
                     <Select
                       value={formData.api_type}
                       onValueChange={(value) => setFormData({ ...formData, api_type: value })}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="Tip API" />
                       </SelectTrigger>
                       <SelectContent>
                         {API_TYPES.map(type => (
                           <SelectItem key={type} value={type}>{type.toUpperCase()}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                 </div>
                 <div>
                   <Label htmlFor="source_url">URL *</Label>
                   <Input
                     id="source_url"
                     value={formData.source_url}
                     onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                     placeholder="https://api.example.com/data"
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="api_key_name">Nume Secret (API Key)</Label>
                     <Input
                       id="api_key_name"
                       value={formData.api_key_name}
                       onChange={(e) => setFormData({ ...formData, api_key_name: e.target.value })}
                       placeholder="OPENWEATHER_API_KEY"
                     />
                   </div>
                   <div>
                     <Label htmlFor="refresh_interval">Interval Refresh (ore)</Label>
                     <Input
                       id="refresh_interval"
                       type="number"
                       value={formData.refresh_interval_hours}
                       onChange={(e) => setFormData({ ...formData, refresh_interval_hours: e.target.value })}
                     />
                   </div>
                 </div>
                 <div className="flex items-center gap-2">
                   <Switch
                     id="is_active"
                     checked={formData.is_active}
                     onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                   />
                   <Label htmlFor="is_active">Activ</Label>
                 </div>
                 <div className="flex justify-end gap-2">
                   <Button variant="outline" onClick={() => setDialogOpen(false)}>
                     Anulează
                   </Button>
                   <Button onClick={handleSave} disabled={saving}>
                     {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                     Salvează
                   </Button>
                 </div>
               </div>
             </DialogContent>
           </Dialog>
         </div>
       </CardHeader>
       <CardContent>
         <div className="rounded-md border">
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Sursă</TableHead>
                 <TableHead>Tip</TableHead>
                 <TableHead>Status</TableHead>
                 <TableHead>Ultima Sincronizare</TableHead>
                 <TableHead className="text-center">Activ</TableHead>
                 <TableHead className="text-right">Acțiuni</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {sources.map((source) => (
                 <TableRow key={source.id}>
                   <TableCell>
                     <div>
                       <div className="font-medium flex items-center gap-2">
                         <Database className="w-4 h-4 text-muted-foreground" />
                         {source.source_name}
                       </div>
                       <div className="text-xs text-muted-foreground truncate max-w-xs">
                         {source.source_url}
                       </div>
                     </div>
                   </TableCell>
                   <TableCell>
                     <Badge variant="outline">{source.source_type}</Badge>
                   </TableCell>
                   <TableCell>{getStatusBadge(source.sync_status)}</TableCell>
                   <TableCell className="text-sm text-muted-foreground">
                     {formatDate(source.last_sync_at)}
                   </TableCell>
                   <TableCell className="text-center">
                     <Switch
                       checked={source.is_active ?? false}
                       onCheckedChange={(checked) => toggleActive(source.id, checked)}
                     />
                   </TableCell>
                   <TableCell className="text-right">
                     <div className="flex justify-end gap-2">
                       <Button variant="ghost" size="sm" onClick={() => handleEdit(source)}>
                         <Pencil className="w-4 h-4" />
                       </Button>
                       <Button variant="ghost" size="sm" onClick={() => handleDelete(source.id)}>
                         <Trash2 className="w-4 h-4 text-destructive" />
                       </Button>
                     </div>
                   </TableCell>
                 </TableRow>
               ))}
               {sources.length === 0 && (
                 <TableRow>
                   <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                     Nu există surse de date configurate
                   </TableCell>
                 </TableRow>
               )}
             </TableBody>
           </Table>
         </div>
       </CardContent>
     </Card>
   );
 };