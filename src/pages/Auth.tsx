 import { useState, useEffect } from 'react';
 import { useNavigate, useSearchParams } from 'react-router-dom';
 import { Header } from '@/components/Header';
 import { Footer } from '@/components/Footer';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Loader2, Mail, Lock, User } from 'lucide-react';
 import { supabase } from '@/integrations/supabase/client';
 import { lovable } from '@/integrations/lovable/index';
 import { toast } from 'sonner';
 
 const AuthPage = () => {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const redirectTo = searchParams.get('redirect') || '/';
   
   const [loading, setLoading] = useState(false);
   const [checkingAuth, setCheckingAuth] = useState(true);
   const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
 
   const [loginData, setLoginData] = useState({ email: '', password: '' });
   const [signupData, setSignupData] = useState({ email: '', password: '', name: '' });
 
   useEffect(() => {
     const checkAuth = async () => {
       const { data: { session } } = await supabase.auth.getSession();
       if (session) {
         navigate(redirectTo);
       }
       setCheckingAuth(false);
     };
     checkAuth();
   }, [navigate, redirectTo]);
 
   const handleLogin = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!loginData.email || !loginData.password) {
       toast.error('Completează toate câmpurile');
       return;
     }
 
     setLoading(true);
     const { error } = await supabase.auth.signInWithPassword({
       email: loginData.email,
       password: loginData.password,
     });
 
     if (error) {
       toast.error(error.message === 'Invalid login credentials' 
         ? 'Email sau parolă incorectă' 
         : error.message);
     } else {
       toast.success('Autentificat cu succes!');
       navigate(redirectTo);
     }
     setLoading(false);
   };
 
   const handleSignup = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!signupData.email || !signupData.password) {
       toast.error('Completează toate câmpurile');
       return;
     }
 
     if (signupData.password.length < 6) {
       toast.error('Parola trebuie să aibă cel puțin 6 caractere');
       return;
     }
 
     setLoading(true);
     const { error } = await supabase.auth.signUp({
       email: signupData.email,
       password: signupData.password,
       options: {
         data: { name: signupData.name },
         emailRedirectTo: `${window.location.origin}${redirectTo}`,
       },
     });
 
     if (error) {
       toast.error(error.message);
     } else {
       toast.success('Verifică email-ul pentru a confirma contul!');
       setActiveTab('login');
     }
     setLoading(false);
   };
 
   const handleGoogleLogin = async () => {
     setLoading(true);
     const { error } = await lovable.auth.signInWithOAuth('google', {
       redirect_uri: `${window.location.origin}${redirectTo}`,
     });
 
     if (error) {
       toast.error('Eroare la autentificare cu Google');
       console.error(error);
     }
     setLoading(false);
   };
 
   if (checkingAuth) {
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
 
   return (
     <div className="min-h-screen flex flex-col bg-background">
       <Header />
       <main className="flex-1 container mx-auto px-4 py-16">
         <Card className="max-w-md mx-auto">
           <CardHeader className="text-center">
             <CardTitle className="text-2xl">Bine ai venit!</CardTitle>
             <CardDescription>
               Autentifică-te pentru a accesa toate funcționalitățile
             </CardDescription>
           </CardHeader>
           <CardContent>
             <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
               <TabsList className="grid w-full grid-cols-2 mb-6">
                 <TabsTrigger value="login">Autentificare</TabsTrigger>
                 <TabsTrigger value="signup">Înregistrare</TabsTrigger>
               </TabsList>
 
               <TabsContent value="login">
                 <form onSubmit={handleLogin} className="space-y-4">
                   <div>
                     <Label htmlFor="login-email">Email</Label>
                     <div className="relative">
                       <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <Input
                         id="login-email"
                         type="email"
                         placeholder="email@exemplu.ro"
                         value={loginData.email}
                         onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                         className="pl-10"
                       />
                     </div>
                   </div>
                   <div>
                     <Label htmlFor="login-password">Parolă</Label>
                     <div className="relative">
                       <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <Input
                         id="login-password"
                         type="password"
                         placeholder="••••••••"
                         value={loginData.password}
                         onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                         className="pl-10"
                       />
                     </div>
                   </div>
                   <Button type="submit" className="w-full" disabled={loading}>
                     {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                     Autentificare
                   </Button>
                 </form>
               </TabsContent>
 
               <TabsContent value="signup">
                 <form onSubmit={handleSignup} className="space-y-4">
                   <div>
                     <Label htmlFor="signup-name">Nume</Label>
                     <div className="relative">
                       <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <Input
                         id="signup-name"
                         type="text"
                         placeholder="Numele tău"
                         value={signupData.name}
                         onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                         className="pl-10"
                       />
                     </div>
                   </div>
                   <div>
                     <Label htmlFor="signup-email">Email</Label>
                     <div className="relative">
                       <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <Input
                         id="signup-email"
                         type="email"
                         placeholder="email@exemplu.ro"
                         value={signupData.email}
                         onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                         className="pl-10"
                       />
                     </div>
                   </div>
                   <div>
                     <Label htmlFor="signup-password">Parolă</Label>
                     <div className="relative">
                       <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <Input
                         id="signup-password"
                         type="password"
                         placeholder="Minim 6 caractere"
                         value={signupData.password}
                         onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                         className="pl-10"
                       />
                     </div>
                   </div>
                   <Button type="submit" className="w-full" disabled={loading}>
                     {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                     Creează cont
                   </Button>
                 </form>
               </TabsContent>
             </Tabs>
 
             <div className="relative my-6">
               <div className="absolute inset-0 flex items-center">
                 <span className="w-full border-t border-border" />
               </div>
               <div className="relative flex justify-center text-xs uppercase">
                 <span className="bg-card px-2 text-muted-foreground">sau</span>
               </div>
             </div>
 
             <Button 
               variant="outline" 
               className="w-full gap-2" 
               onClick={handleGoogleLogin}
               disabled={loading}
             >
               <svg className="w-5 h-5" viewBox="0 0 24 24">
                 <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                 <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                 <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                 <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
               </svg>
               Continuă cu Google
             </Button>
           </CardContent>
         </Card>
       </main>
       <Footer />
     </div>
   );
 };
 
 export default AuthPage;