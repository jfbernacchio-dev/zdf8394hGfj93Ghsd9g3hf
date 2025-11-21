import { Check, ChevronsUpDown, Building2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

/**
 * ============================================================================
 * FASE 10.6: Organization Switcher
 * ============================================================================
 * 
 * Componente para alternar entre empresas/organizações do usuário.
 * Exibe lista de organizações com badge "Primária" e CNPJ mascarado.
 * Ao trocar, atualiza contexto global e localStorage.
 */

export function OrganizationSwitcher() {
  const navigate = useNavigate();
  const { organizations, activeOrganizationId, setActiveOrganizationId } = useAuth();
  const [open, setOpen] = useState(false);

  if (!organizations || organizations.length === 0) {
    return null;
  }

  const activeOrg = organizations.find(org => org.id === activeOrganizationId);
  
  const handleSelect = (orgId: string) => {
    if (orgId === activeOrganizationId) {
      setOpen(false);
      return;
    }
    
    setActiveOrganizationId(orgId);
    setOpen(false);
    window.location.reload();
  };

  const maskCNPJ = (cnpj: string) => {
    if (!cnpj) return '';
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length !== 14) return cnpj;
    return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Selecionar organização"
          className="w-[240px] justify-between"
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {activeOrg ? activeOrg.legal_name : 'Selecionar empresa'}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar empresa..." />
          <CommandList>
            <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
            <CommandGroup heading="Suas Empresas">
              {organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  onSelect={() => handleSelect(org.id)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        activeOrganizationId === org.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate font-medium">{org.legal_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {maskCNPJ(org.cnpj)}
                      </span>
                    </div>
                    {org.is_primary && (
                      <Badge variant="secondary" className="ml-2 shrink-0">
                        Primária
                      </Badge>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  navigate('/setup-organization');
                }}
                className="cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Criar nova empresa</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
