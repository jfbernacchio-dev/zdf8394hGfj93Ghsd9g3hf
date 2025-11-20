import Layout from '@/components/Layout';
import { OrganogramView } from '@/components/organogram/OrganogramView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Network } from 'lucide-react';

const Organogram = () => {
  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Network className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Organograma Hierárquico</CardTitle>
                <CardDescription>
                  Gerencie a estrutura organizacional, posições e atribuições de usuários
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium">Como usar:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Arraste posições para reorganizar a hierarquia</li>
                  <li>Arraste usuários para atribuí-los a diferentes posições</li>
                  <li>Clique em <strong>Editar</strong> para renomear uma posição</li>
                  <li>Clique em <strong>+</strong> para criar uma posição subordinada</li>
                  <li>Clique em <strong>Excluir</strong> para remover posições vazias</li>
                  <li>Passe o mouse sobre as posições para ver suas permissões</li>
                </ul>
              </div>

              <OrganogramView />
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Organogram;
