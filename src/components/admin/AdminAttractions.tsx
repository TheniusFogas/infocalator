 import { useState, useEffect } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Badge } from '@/components/ui/badge';
 import { Switch } from '@/components/ui/switch';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Plus, Pencil, Trash2, Loader2, Save, Eye, MapPin } from 'lucide-react';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 
 interface CachedAttraction {
   id: string;
   title: string;
   slug: string;
   category: string | null;
   description: string | null;
   location: string;
   county: string | null;
   is_paid: boolean | null;
   entry_fee: string | null;
   view_count: number | null;
   expires_at: string;
 }
 
 const CATEGORIES = ['Muzeu', 'Natură', 'Istoric', 'Religios', 'Recreere', 'Traseu', 'Castel', 'Cascadă', 'Peșteră', 'Lac'];
 
 export const AdminAttractions = () => {
   const [attractions, setAttractions] = useState<CachedAttraction[]>([]);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [dialogOpen, setDialogOpen] = useState(false);
   const [editingAttraction, setEditingAttraction] = useState<CachedAttraction | null>(null);
   const [searchQuery, setSearchQuery] = useState('');
 
   const [formData, setFormData] = useState({
     title: '',
     slug: '',
     category: '',
     description: '',
     location: '',
     county: '',
     is_paid: false,
     entry_fee: '',
   });
 
   useEffect(() => {
     fetchAttractions();
   }, []);
 
   const fetchAttractions = async () => {
     setLoading(true);
     const { data, error } = await supabase
       .from('cached_attractions')
       .select('id, title, slug, category, description, location, county, is_paid, entry_fee, view_count, expires_at')
       .order('view_count', { ascending: false })
       .limit(100);
 
     if (error) {
       toast.error('Eroare la încărcarea atracțiilor');
     } else {
       setAttractions(data || []);
     }
     setLoading(false);
   };
 
   const handleEdit = (attraction: CachedAttraction) => {
     setEditingAttraction(attraction);
     setFormData({
       title: attraction.title,
       slug: attraction.slug,
       category: attraction.category || '',
       description: attraction.description || '',
       location: attraction.location,
       county: attraction.county || '',
       is_paid: attraction.is_paid || false,
       entry_fee: attraction.entry_fee || '',
     });
     setDialogOpen(true);
   };
 
   const handleNew = () => {
     setEditingAttraction(null);
     setFormData({
       title: '',
       slug: '',
       category: '',
       description: '',
       location: '',
       county: '',
       is_paid: false,
       entry_fee: '',
     });
     setDialogOpen(true);
   };
 
   const generateSlug = (title: string) => {
     return title
       .toLowerCase()
       .normalize('NFD')
       .replace(/[\u0300-\u036f]/g, '')
       .replace(/[^a-z0-9]+/g, '-')
       .replace(/(^-|-$)/g, '');
   };
 
   const handleSave = async () => {
     if (!formData.title || !formData.location) {
       toast.error('Titlul și locația sunt obligatorii');
       return;
     }
 
     setSaving(true);
     const slug = formData.slug || generateSlug(formData.title);
     const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
 
     const attractionData = {
       title: formData.title,
       slug,
       category: formData.category || null,
       description: formData.description || null,
       location: formData.location,
       county: formData.county || null,
       is_paid: formData.is_paid,
       entry_fee: formData.is_paid ? formData.entry_fee : null,
       expires_at: expiresAt,
     };
 
     if (editingAttraction) {
       const { error } = await supabase
         .from('cached_attractions')
         .update(attractionData)
         .eq('id', editingAttraction.id);
 
       if (error) {
         toast.error('Eroare la actualizare');
       } else {
         toast.success('Atracția a fost actualizată');
         setDialogOpen(false);
         fetchAttractions();
       }
     } else {
       const { error } = await supabase
         .from('cached_attractions')
         .insert([{ ...attractionData, view_count: 0 }]);
 
       if (error) {
         toast.error('Eroare la adăugare');
       } else {
         toast.success('Atracția a fost adăugată');
         setDialogOpen(false);
         fetchAttractions();
       }
     }
     setSaving(false);
   };
 
   const handleDelete = async (id: string) => {
     if (!confirm('Sigur dorești să ștergi această atracție?')) return;
 
     const { error } = await supabase
       .from('cached_attractions')
       .delete()
       .eq('id', id);
 
     if (error) {
       toast.error('Eroare la ștergere');
     } else {
       toast.success('Atracția a fost ștearsă');
       fetchAttractions();
     }
   };
 
   const filteredAttractions = attractions.filter(a =>
     a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     a.location.toLowerCase().includes(searchQuery.toLowerCase())
   );
 
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
             <CardTitle>Atracții Turistice</CardTitle>
             <CardDescription>Gestionează atracțiile turistice din baza de date</CardDescription>
           </div>
           <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
             <DialogTrigger asChild>
               <Button onClick={handleNew}>
                 <Plus className="w-4 h-4 mr-2" />
                 Adaugă Atracție
               </Button>
             </DialogTrigger>
             <DialogContent className="max-w-2xl">
               <DialogHeader>
                 <DialogTitle>
                   {editingAttraction ? 'Editează Atracția' : 'Adaugă Atracție Nouă'}
                 </DialogTitle>
               </DialogHeader>
               <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="title">Titlu *</Label>
                     <Input
                       id="title"
                       value={formData.title}
                       onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                       placeholder="Castelul Bran"
                     />
                   </div>
                   <div>
                     <Label htmlFor="slug">Slug (URL)</Label>
                     <Input
                       id="slug"
                       value={formData.slug}
                       onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                       placeholder="castelul-bran"
                     />
                   </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="location">Locație *</Label>
                     <Input
                       id="location"
                       value={formData.location}
                       onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                       placeholder="Bran"
                     />
                   </div>
                   <div>
                     <Label htmlFor="county">Județ</Label>
                     <Input
                       id="county"
                       value={formData.county}
                       onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                       placeholder="Brașov"
                     />
                   </div>
                 </div>
                 <div>
                   <Label htmlFor="category">Categorie</Label>
                   <Select
                     value={formData.category}
                     onValueChange={(value) => setFormData({ ...formData, category: value })}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="Selectează categoria" />
                     </SelectTrigger>
                     <SelectContent>
                       {CATEGORIES.map(cat => (
                         <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 <div>
                   <Label htmlFor="description">Descriere</Label>
                   <Textarea
                     id="description"
                     value={formData.description}
                     onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                     placeholder="Descriere scurtă a atracției..."
                     rows={3}
                   />
                 </div>
                 <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2">
                     <Switch
                       id="is_paid"
                       checked={formData.is_paid}
                       onCheckedChange={(checked) => setFormData({ ...formData, is_paid: checked })}
                     />
                     <Label htmlFor="is_paid">Cu plată</Label>
                   </div>
                   {formData.is_paid && (
                     <div className="flex-1">
                       <Input
                         value={formData.entry_fee}
                         onChange={(e) => setFormData({ ...formData, entry_fee: e.target.value })}
                         placeholder="ex: 50 RON"
                       />
                     </div>
                   )}
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
         <div className="mb-4">
           <Input
             placeholder="Caută atracții..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="max-w-sm"
           />
         </div>
         <div className="rounded-md border">
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Titlu</TableHead>
                 <TableHead>Locație</TableHead>
                 <TableHead>Categorie</TableHead>
                 <TableHead className="text-center">Vizualizări</TableHead>
                 <TableHead className="text-right">Acțiuni</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {filteredAttractions.map((attraction) => (
                 <TableRow key={attraction.id}>
                   <TableCell className="font-medium">{attraction.title}</TableCell>
                   <TableCell>
                     <div className="flex items-center gap-1 text-muted-foreground">
                       <MapPin className="w-3 h-3" />
                       {attraction.location}
                       {attraction.county && `, ${attraction.county}`}
                     </div>
                   </TableCell>
                   <TableCell>
                     {attraction.category && (
                       <Badge variant="secondary">{attraction.category}</Badge>
                     )}
                   </TableCell>
                   <TableCell className="text-center">
                     <div className="flex items-center justify-center gap-1">
                       <Eye className="w-3 h-3 text-muted-foreground" />
                       {attraction.view_count || 0}
                     </div>
                   </TableCell>
                   <TableCell className="text-right">
                     <div className="flex justify-end gap-2">
                       <Button variant="ghost" size="sm" onClick={() => handleEdit(attraction)}>
                         <Pencil className="w-4 h-4" />
                       </Button>
                       <Button variant="ghost" size="sm" onClick={() => handleDelete(attraction.id)}>
                         <Trash2 className="w-4 h-4 text-destructive" />
                       </Button>
                     </div>
                   </TableCell>
                 </TableRow>
               ))}
               {filteredAttractions.length === 0 && (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                     Nu există atracții în baza de date
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