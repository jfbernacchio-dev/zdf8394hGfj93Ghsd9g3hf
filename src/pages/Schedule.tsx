import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, User } from 'lucide-react';

const Schedule = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    const { data } = await supabase
      .from('sessions')
      .select('*, patients!inner(*)')
      .eq('patients.user_id', user!.id);
    setSessions(data || []);
  };


  return (
    <div className="min-h-screen bg-[var(--gradient-soft)]">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Agenda</h1>
        <Card className="p-6">
          <p className="text-muted-foreground">Visualização da agenda em desenvolvimento...</p>
        </Card>
      </div>
    </div>
  );
};

export default Schedule;
