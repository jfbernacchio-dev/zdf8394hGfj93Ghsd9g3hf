import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RequireActiveProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequireActiveProfileDialog({
  open,
  onOpenChange,
}: RequireActiveProfileDialogProps) {
  const navigate = useNavigate();

  const handleCreateProfile = () => {
    onOpenChange(false);
    navigate('/admin-settings?tab=layouts');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Profile Necessário</AlertDialogTitle>
          <AlertDialogDescription>
            Para editar o layout, você precisa primeiro criar um profile. 
            Profiles permitem que você salve e restaure suas configurações de layout.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleCreateProfile}>
            Criar Profile Agora
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
