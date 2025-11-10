# Guia de Sincronização de Layouts

## Visão Geral

O sistema de sincronização de layouts permite que os usuários personalizem a interface e tenham suas configurações sincronizadas automaticamente entre dispositivos.

## Arquitetura

### 1. **Banco de Dados (Fonte da Verdade)**
- Tabela: `user_layout_preferences`
- Armazena configurações de layout indexadas por `user_id` e `layout_type`
- Suporta Realtime para sincronização automática

### 2. **localStorage (Cache Local)**
- Usado apenas para performance e funcionamento offline
- Sincronizado automaticamente com o banco

### 3. **Realtime Sync**
- Atualiza automaticamente quando layouts são alterados em outro dispositivo
- Sem necessidade de recarregar página

## Tipos de Layout

```typescript
type LayoutType = 'dashboard' | 'patient-detail' | 'evolution';
```

## Como Usar

### 1. Hook `useLayoutSync`

```typescript
import { useLayoutSync } from '@/hooks/useLayoutSync';
import { DEFAULT_LAYOUT } from '@/lib/defaultLayout';

function MyComponent() {
  const { 
    layout,           // Configuração atual
    setLayout,        // Atualizar localmente
    saveUserLayout,   // Salvar no banco
    isLoading,        // Carregando inicial
    isSyncing         // Salvando
  } = useLayoutSync('dashboard', DEFAULT_LAYOUT);

  // Usar layout normalmente
  const { visibleCards, cardSizes, sectionHeights } = layout;
}
```

### 2. Salvar Alterações

```typescript
const handleSaveLayout = async () => {
  const newLayout = {
    visibleCards: ['card-1', 'card-2'],
    cardSizes: { 'card-1': { width: 400, height: 300, x: 0, y: 0 } },
    sectionHeights: { 'section-1': 600 }
  };

  const success = await saveUserLayout(newLayout);
  
  if (success) {
    // Reload para aplicar mudanças
    window.location.reload();
  }
};
```

### 3. Exportar Template

No perfil do usuário:

```typescript
import { LayoutTemplateManager } from '@/components/LayoutTemplateManager';

// Renderizar componente
<LayoutTemplateManager />
```

Isso permite:
- **Exportar**: Salvar layout como arquivo JSON
- **Importar**: Carregar layout de outro terapeuta
- **Compartilhar**: Templates podem ser trocados entre usuários

## Formato do Template

```json
{
  "name": "Layout Minimalista",
  "description": "Layout focado em dados essenciais",
  "layout_type": "dashboard",
  "layout_config": {
    "visibleCards": ["card-sessions", "card-revenue"],
    "cardSizes": {
      "card-sessions": { "width": 400, "height": 300, "x": 0, "y": 0 }
    },
    "sectionHeights": {
      "section-metrics": 800
    }
  },
  "version": 5,
  "exported_at": "2025-01-10T15:30:00Z",
  "exported_by": "therapist@example.com"
}
```

## Fluxo de Sincronização

### Inicialização
```
1. Componente monta
2. useLayoutSync carrega layout do DB
3. Atualiza localStorage como cache
4. Subscreve a mudanças Realtime
5. Renderiza com layout carregado
```

### Salvamento
```
1. Usuário modifica layout
2. Chama saveUserLayout()
3. Salva no DB (incrementa versão)
4. Atualiza localStorage
5. Realtime notifica outros dispositivos
6. Reload aplica mudanças
```

### Sincronização Cross-Device
```
1. PC A: Usuário salva layout
2. DB: Recebe update, incrementa versão
3. Realtime: Notifica PC B subscrito
4. PC B: Recebe notificação
5. PC B: Atualiza localStorage automaticamente
6. PC B: Componente re-renderiza com novo layout
```

### Modo Offline
```
1. Usuário offline modifica layout
2. saveUserLayout() falha
3. Salva em localStorage com flag "pending_sync"
4. Quando online, syncPendingLayouts() executa
5. Upload automático de layouts pendentes
```

## Exemplos de Integração

### Dashboard Component
```typescript
function Dashboard() {
  const { layout, saveUserLayout, isLoading } = useLayoutSync(
    'dashboard',
    DEFAULT_DASHBOARD_LAYOUT
  );

  const [isEditMode, setIsEditMode] = useState(false);
  const [tempLayout, setTempLayout] = useState(layout);

  const handleSave = async () => {
    await saveUserLayout(tempLayout);
    setIsEditMode(false);
    window.location.reload();
  };

  if (isLoading) return <Loader />;

  return (
    <div>
      {isEditMode ? (
        // Edit mode with drag/resize
        <EditableLayout 
          layout={tempLayout} 
          onChange={setTempLayout}
        />
      ) : (
        // View mode
        <StaticLayout layout={layout} />
      )}
      
      <Button onClick={() => setIsEditMode(!isEditMode)}>
        {isEditMode ? 'Salvar' : 'Editar'}
      </Button>
    </div>
  );
}
```

## API Reference

### `loadLayout(userId, layoutType)`
Carrega layout do banco e atualiza cache.

### `saveLayout(userId, layoutType, config)`
Salva layout no banco e cache. Retorna `boolean`.

### `syncPendingLayouts(userId)`
Sincroniza layouts salvos offline.

### `subscribeToLayoutUpdates(userId, layoutType, onUpdate)`
Subscreve a atualizações Realtime. Retorna `RealtimeChannel`.

### `exportLayoutTemplate(userId, layoutType, name, description)`
Exporta layout como arquivo JSON. Retorna `Blob`.

### `importLayoutTemplate(userId, file)`
Importa layout de arquivo JSON.

### `resetLayoutToDefault(userId, layoutType)`
Remove layout customizado, volta ao padrão.

## Benefícios

✅ **Sincronização Multi-Device**: Configurações seguem o usuário  
✅ **Funciona Offline**: Sync automático quando volta online  
✅ **Realtime Updates**: Mudanças aparecem instantaneamente  
✅ **Performance**: localStorage como cache rápido  
✅ **Compartilhamento**: Templates entre terapeutas  
✅ **Versionamento**: Controle de versões automático  
✅ **Backup Automático**: Layouts salvos no banco  

## Troubleshooting

### Layout não sincroniza
1. Verificar se Realtime está habilitado na tabela
2. Confirmar subscrição ativa no console
3. Verificar logs do navegador

### Conflitos entre dispositivos
- Sistema usa "last write wins"
- Última versão salva sempre prevalece
- Versão mais recente sobrescreve

### Performance
- Cache localStorage previne queries desnecessárias
- Realtime evita polling
- Sincronização on-demand para pending layouts
