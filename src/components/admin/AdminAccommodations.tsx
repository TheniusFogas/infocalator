 import { useState, useEffect } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Badge } from '@/components/ui/badge';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Plus, Pencil, Trash2, Loader2, Save, Star, MapPin } from 'lucide-react';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 
 interface CachedAccommodation {
   id: string;
   name: string;
   slug: string;
   type: string | null;
   description: string | null;
   location: string;
   county: string | null;
   stars: number | null;
   rating: number | null;
   price_range: string | null;
   expires_at: string;
 }
 
 const TYPES = ['Hotel', 'Pensiune', 'Vila', 'Apartament', 'Cabană', 'Hostel', 'Resort', 'Motel'];
 
 export const AdminAccommodations = () => {
   const [accommodations, setAccommodations] = useState<CachedAccommodation[]>([]);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [dialogOpen, setDialogOpen] = useState(false);
   const [editingItem, setEditingItem] = useState<CachedAccommodation | null>(null);
   const [searchQuery, setSearchQuery] = useState('');
 
   const [formData, setFormData] = useState({
     name: '',
     slug: '',
     type: '',
     description: '',
     location: '',
     county: '',
     stars: '',
     price_range: '',
   });
 
   useEffect(() => {
     fetchAccommodations();
   }, []);
 
   const fetchAccommodations = async () => {
     setLoading(true);
     const { data, error } = await supabase
       .from('cached_accommodations')
       .select('id, name, slug, type, description, location, county, stars, rating, price_range, expires_at')
       .order('rating', { ascending: false })
       .limit(100);
 
     if (error) {
       toast.error('Eroare la încărcarea cazărilor');
     } else {
       setAccommodations(data || []);
     }
     setLoading(false);
   };
 
   const handleEdit = (item: CachedAccommodation) => {
     setEditingItem(item);
     setFormData({
       name: item.name,
       slug: item.slug,
       type: item.type || '',
       description: item.description || '',
       location: item.location,
       county: item.county || '',
       stars: item.stars?.toString() || '',
       price_range: item.price_range || '',
     });
     setDialogOpen(true);
   };
 
   const handleNew = () => {
     setEditingItem(null);
     setFormData({
       name: '',
       slug: '',
       type: '',
       description: '',
       location: '',
       county: '',
       stars: '',
       price_range: '',
     });
     setDialogOpen(true);
   };
 
   const generateSlug = (name: string) => {
     return name
       .toLowerCase()
       .normalize('NFD')
       .replace(/[\u0300-\u036f]/g, '')
       .replace(/[^a-z0-9]+/g, '-')
       .replace(/(^-|-$)/g, '');
   };
 
   const handleSave = async () => {
     if (!formData.name || !formData.location) {
       toast.error('Numele și locația sunt obligatorii');
       return;
     }
 
     setSaving(true);
     const slug = formData.slug || generateSlug(formData.name);
     const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
 
     const accommodationData = {
       name: formData.name,
       slug,
       type: formData.type || null,
       description: formData.description || null,
       location: formData.location,
       county: formData.county || null,
       stars: formData.stars ? parseInt(formData.stars) : null,
       price_range: formData.price_range || null,
       expires_at: expiresAt,
     };
 
     if (editingItem) {
       const { error } = await supabase
         .from('cached_accommodations')
         .update(accommodationData)
         .eq('id', editingItem.id);
 
       if (error) {
         toast.error('Eroare la actualizare');
       } else {
         toast.success('Cazarea a fost actualizată');
         setDialogOpen(false);
         fetchAccommodations();
       }
     } else {
       const { error } = await supabase
         .from('cached_accommodations')
         .insert([accommodationData]);
 
       if (error) {
         toast.error('Eroare la adăugare');
       } else {
         toast.success('Cazarea a fost adăugată');
         setDialogOpen(false);
         fetchAccommodations();
       }
     }
     setSaving(false);
   };
 
   const handleDelete = async (id: string) => {
     if (!confirm('Sigur dorești să ștergi această cazare?')) return;
 
     const { error } = await supabase
       .from('cached_accommodations')
       .delete()
       .eq('id', id);
 
     if (error) {
       toast.error('Eroare la ștergere');
     } else {
       toast.success('Cazarea a fost ștearsă');
       fetchAccommodations();
     }
   };
 
   const filteredItems = accommodations.filter(a =>
     a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
             <CardTitle>Cazări</CardTitle>
             <CardDescription>Gestionează cazările din baza de date</CardDescription>
           </div>
           <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
             <DialogTrigger asChild>
               <Button onClick={handleNew}>
                 <Plus className="w-4 h-4 mr-2" />
                 Adaugă Cazare
               </Button>
             </DialogTrigger>
             <DialogContent className="max-w-2xl">
               <DialogHeader>
                 <DialogTitle>
                   {editingItem ? 'Editează Cazarea' : 'Adaugă Cazare Nouă'}
                 </DialogTitle>
               </DialogHeader>
               <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="name">Nume *</Label>
                     <Input
                       id="name"
                       value={formData.name}
                       onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                       placeholder="Hotel Athénée Palace"
                     />
                   </div>
                   <div>
                     <Label htmlFor="slug">Slug (URL)</Label>
                     <Input
                       id="slug"
                       value={formData.slug}
                       onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                       placeholder="hotel-athenee-palace"
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
                       placeholder="București"
                     />
                   </div>
                   <div>
                     <Label htmlFor="county">Județ</Label>
                     <Input
                       id="county"
                       value={formData.county}
                       onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                       placeholder="București"
                     />
                   </div>
                 </div>
                 <div className="grid grid-cols-3 gap-4">
                   <div>
                     <Label htmlFor="type">Tip</Label>
                     <Select
                       value={formData.type}
                       onValueChange={(value) => setFormData({ ...formData, type: value })}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="Tip cazare" />
                       </SelectTrigger>
                       <SelectContent>
                         {TYPES.map(type => (
                           <SelectItem key={type} value={type}>{type}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   <div>
                     <Label htmlFor="stars">Stele</Label>
                     <Select
                       value={formData.stars}
                       onValueChange={(value) => setFormData({ ...formData, stars: value })}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="Stele" />
                       </SelectTrigger>
                       <SelectContent>
                         {[1, 2, 3, 4, 5].map(s => (
                           <SelectItem key={s} value={s.toString()}>{s} stele</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   <div>
                     <Label htmlFor="price_range">Preț</Label>
                     <Input
                       id="price_range"
                       value={formData.price_range}
                       onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                       placeholder="200-400 RON"
                     />
                   </div>
                 </div>
                 <div>
                   <Label htmlFor="description">Descriere</Label>
                   <Textarea
                     id="description"
                     value={formData.description}
                     onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                     placeholder="Descriere scurtă a cazării..."
                     rows={3}
                   />
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
             placeholder="Caută cazări..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="max-w-sm"
           />
         </div>
         <div className="rounded-md border">
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Nume</TableHead>
                 <TableHead>Locație</TableHead>
                 <TableHead>Tip</TableHead>
                 <TableHead className="text-center">Stele</TableHead>
                 <TableHead>Preț</TableHead>
                 <TableHead className="text-right">Acțiuni</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {filteredItems.map((item) => (
                 <TableRow key={item.id}>
                   <TableCell className="font-medium">{item.name}</TableCell>
                   <TableCell>
                     <div className="flex items-center gap-1 text-muted-foreground">
                       <MapPin className="w-3 h-3" />
                       {item.location}
                       {item.county && `, ${item.county}`}
                     </div>
                   </TableCell>
                   <TableCell>
                     {item.type && <Badge variant="secondary">{item.type}</Badge>}
                   </TableCell>
                   <TableCell className="text-center">
                     {item.stars && (
                       <div className="flex items-center justify-center gap-1">
                         <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                         {item.stars}
                       </div>
                     )}
                   </TableCell>
                   <TableCell>{item.price_range}</TableCell>
                   <TableCell className="text-right">
                     <div className="flex justify-end gap-2">
                       <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                         <Pencil className="w-4 h-4" />
                       </Button>
                       <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                         <Trash2 className="w-4 h-4 text-destructive" />
                       </Button>
                     </div>
                   </TableCell>
                 </TableRow>
               ))}
               {filteredItems.length === 0 && (
                 <TableRow>
                   <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                     Nu există cazări în baza de date
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