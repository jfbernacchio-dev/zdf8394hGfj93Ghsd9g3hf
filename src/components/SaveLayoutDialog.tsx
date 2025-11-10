import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface SaveLayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (updateActiveProfile: boolean) => void;
  activeProfileName?: string;
}

export function SaveLayoutDialog({
  open,
  onOpenChange,
  onConfirm,
  activeProfileName,
}: SaveLayoutDialogProps) {
  const [updateProfile, setUpdateProfile] = useState(true);

  const handleConfirm = () => {
    onConfirm(updateProfile);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Salvar Layout</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja salvar as alterações do layout?
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {activeProfileName && (
          <div className="flex items-center space-x-2 py-4">
            <Checkbox
              id="update-profile"
              checked={updateProfile}
              onCheckedChange={(checked) => setUpdateProfile(checked as boolean)}
            />
            <Label
              htmlFor="update-profile"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Atualizar também no <span className="font-bold">{activeProfileName}</span>
            </Label>
          </div>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Salvar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
