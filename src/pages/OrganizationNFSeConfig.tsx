import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

import { ArrowLeft, FileText, Upload, Save, Shield, CalendarIcon, Building2, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function OrganizationNFSeConfig() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { organizationId, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [configExists, setConfigExists] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const [config, setConfig] = useState({
    inscricao_municipal: '',
    cnpj: '',
    razao_social: '',
    codigo_municipio: '',
    regime_tributario: 'simples_nacional',
    anexo_simples: 'V',
    iss_rate: '5.00',
    service_code: '05118',
    service_description: 'Atendimento psicológico individual',
    focusnfe_token_homologacao: '',
    focusnfe_token_production: '',
    focusnfe_environment: 'homologacao',
  });

  const [certificate, setCertificate] = useState({
    certificate_type: 'A1',
    certificate_file: null as File | null,
    certificate_password: '',
    valid_until: '',
  });

  useEffect(() => {
    checkOwnership();
    loadConfig();
  }, [organizationId]);

  const checkOwnership = async () => {
    if (!organizationId || !user) return;

    const { data, error } = await supabase
      .from('organization_owners')
      .select('is_primary')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (data && data.is_primary) {
      setIsOwner(true);
    }
  };

  const loadConfig = async () => {
    if (!organizationId) return;

    try {
      const { data, error } = await supabase
        .from('organization_nfse_config')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('[N3] Error loading organization config:', error);
        return;
      }

      if (data) {
        setConfigExists(true);
        
        // Descriptografar tokens se existirem
        let tokenHomologacao = '';
        let tokenProduction = '';
        
        if (data.focusnfe_token_homologacao) {
          try {
            const { data: decrypted } = await supabase.functions.invoke('decrypt-credentials', {
              body: { 
                encryptedData: data.focusnfe_token_homologacao,
                credentialType: 'focusnfe_token',
                credentialId: data.id
              }
            });
            tokenHomologacao = decrypted?.decrypted || '';
          } catch (e) {
            console.error('[N3] Error decrypting token homologacao:', e);
          }
        }
        
        if (data.focusnfe_token_production) {
          try {
            const { data: decrypted } = await supabase.functions.invoke('decrypt-credentials', {
              body: { 
                encryptedData: data.focusnfe_token_production,
                credentialType: 'focusnfe_token',
                credentialId: data.id
              }
            });
            tokenProduction = decrypted?.decrypted || '';
          } catch (e) {
            console.error('[N3] Error decrypting token production:', e);
          }
        }

        setConfig({
          inscricao_municipal: data.inscricao_municipal || '',
          cnpj: data.cnpj || '',
          razao_social: data.razao_social || '',
          codigo_municipio: data.codigo_municipio || '',
          regime_tributario: data.regime_tributario || 'simples_nacional',
          anexo_simples: data.anexo_simples || 'V',
          iss_rate: data.iss_rate?.toString() || '5.00',
          service_code: data.service_code || '05118',
          service_description: data.service_description || 'Atendimento psicológico individual',
          focusnfe_token_homologacao: tokenHomologacao,
          focusnfe_token_production: tokenProduction,
          focusnfe_environment: data.focusnfe_environment || 'homologacao',
        });

        // Carregar dados do certificado
        if (data.certificate_data) {
          setCertificate(prev => ({
            ...prev,
            certificate_type: data.certificate_type || 'A1',
            valid_until: data.valid_until || '',
          }));
        }
      }
    } catch (error) {
      console.error('[N3] Error loading config:', error);
    }
  };

  const handleSaveFiscalData = async () => {
    if (!organizationId || !isOwner) {
      toast({
        title: 'Permissão negada',
        description: 'Apenas proprietários da organização podem editar as configurações fiscais.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Criptografar tokens
      let encryptedTokenHomologacao = null;
      let encryptedTokenProduction = null;

      if (config.focusnfe_token_homologacao) {
        const { data: encrypted } = await supabase.functions.invoke('encrypt-credential', {
          body: { 
            plainData: config.focusnfe_token_homologacao,
            credentialType: 'focusnfe_token'
          }
        });
        encryptedTokenHomologacao = encrypted?.encrypted;
      }

      if (config.focusnfe_token_production) {
        const { data: encrypted } = await supabase.functions.invoke('encrypt-credential', {
          body: { 
            plainData: config.focusnfe_token_production,
            credentialType: 'focusnfe_token'
          }
        });
        encryptedTokenProduction = encrypted?.encrypted;
      }

      const fiscalData = {
        organization_id: organizationId,
        inscricao_municipal: config.inscricao_municipal,
        cnpj: config.cnpj,
        razao_social: config.razao_social,
        codigo_municipio: config.codigo_municipio,
        regime_tributario: config.regime_tributario,
        anexo_simples: config.anexo_simples,
        iss_rate: parseFloat(config.iss_rate),
        service_code: config.service_code,
        service_description: config.service_description,
        focusnfe_token_homologacao: encryptedTokenHomologacao,
        focusnfe_token_production: encryptedTokenProduction,
        focusnfe_environment: config.focusnfe_environment,
      };

      if (configExists) {
        const { error } = await supabase
          .from('organization_nfse_config')
          .update(fiscalData)
          .eq('organization_id', organizationId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('organization_nfse_config')
          .insert(fiscalData);

        if (error) throw error;
        setConfigExists(true);
      }

      toast({
        title: 'Sucesso',
        description: 'Dados fiscais da organização salvos com sucesso.',
      });
    } catch (error: any) {
      console.error('[N3] Error saving fiscal data:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar dados fiscais',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCertificate(prev => ({ ...prev, certificate_file: file }));
    }
  };

  const handleSaveCertificate = async () => {
    if (!organizationId || !isOwner) {
      toast({
        title: 'Permissão negada',
        description: 'Apenas proprietários da organização podem editar o certificado digital.',
        variant: 'destructive'
      });
      return;
    }

    if (!certificate.certificate_file && !configExists) {
      toast({
        title: 'Erro',
        description: 'Selecione um arquivo de certificado',
        variant: 'destructive'
      });
      return;
    }

    if (!certificate.certificate_password) {
      toast({
        title: 'Erro',
        description: 'Digite a senha do certificado',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      let certificateData = null;

      if (certificate.certificate_file) {
        const reader = new FileReader();
        certificateData = await new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(certificate.certificate_file!);
        });
      }

      // Criptografar senha do certificado
      const { data: encryptedPassword } = await supabase.functions.invoke('encrypt-credential', {
        body: { 
          plainData: certificate.certificate_password,
          credentialType: 'certificate_password'
        }
      });

      // Criptografar dados do certificado se houver arquivo novo
      let encryptedCertData = null;
      if (certificateData) {
        const { data: encryptedCert } = await supabase.functions.invoke('encrypt-credential', {
          body: { 
            plainData: certificateData,
            credentialType: 'certificate_data'
          }
        });
        encryptedCertData = encryptedCert?.encrypted;
      }

      const certUpdate: any = {
        certificate_password: encryptedPassword?.encrypted,
        certificate_type: certificate.certificate_type,
        valid_until: certificate.valid_until || null,
      };

      if (encryptedCertData) {
        certUpdate.certificate_data = encryptedCertData;
      }

      if (configExists) {
        const { error } = await supabase
          .from('organization_nfse_config')
          .update(certUpdate)
          .eq('organization_id', organizationId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('organization_nfse_config')
          .insert({
            organization_id: organizationId,
            ...certUpdate
          });

        if (error) throw error;
        setConfigExists(true);
      }

      toast({
        title: 'Sucesso',
        description: 'Certificado digital salvo com sucesso.',
      });

      // Limpar arquivo após salvar
      setCertificate(prev => ({ ...prev, certificate_file: null }));
    } catch (error: any) {
      console.error('[N3] Error saving certificate:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar certificado',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOwner) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                Configuração NFSe da Organização
              </h1>
              <p className="text-muted-foreground">
                Gerenciar configurações fiscais da organização
              </p>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Você não tem permissão para editar as configurações fiscais da organização.
              Apenas proprietários da organização (owners) podem gerenciar essas configurações.
              <br /><br />
              <strong>A configuração da organização será usada automaticamente</strong> quando você emitir notas fiscais.
            </AlertDescription>
          </Alert>

          <div className="mt-6 space-y-4">
            <div>
              <Label>Ambiente Atual</Label>
              <Input value={config.focusnfe_environment === 'producao' ? 'Produção' : 'Homologação'} readOnly />
            </div>
            {configExists && (
              <>
                <div>
                  <Label>CNPJ</Label>
                  <Input value={config.cnpj} readOnly />
                </div>
                <div>
                  <Label>Razão Social</Label>
                  <Input value={config.razao_social} readOnly />
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Configuração NFSe da Organização
            </h1>
            <p className="text-muted-foreground">
              Configuração centralizada de NFSe para toda a organização
            </p>
          </div>
        </div>

        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>FASE N3 - Configuração Organizacional:</strong>
            <br />
            Esta configuração será usada por todos os membros da organização ao emitir NFSe.
            Apenas proprietários da organização podem editar essas configurações.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="fiscal">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fiscal" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Dados Fiscais
            </TabsTrigger>
            <TabsTrigger value="certificate" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Certificado Digital
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fiscal" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
                <Input
                  id="inscricao_municipal"
                  value={config.inscricao_municipal}
                  onChange={(e) => setConfig({ ...config, inscricao_municipal: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={config.cnpj}
                  onChange={(e) => setConfig({ ...config, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="razao_social">Razão Social</Label>
                <Input
                  id="razao_social"
                  value={config.razao_social}
                  onChange={(e) => setConfig({ ...config, razao_social: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="codigo_municipio">Código do Município</Label>
                <Input
                  id="codigo_municipio"
                  value={config.codigo_municipio}
                  onChange={(e) => setConfig({ ...config, codigo_municipio: e.target.value })}
                  placeholder="Ex: 3550308 (São Paulo)"
                />
              </div>

              <div>
                <Label htmlFor="regime_tributario">Regime Tributário</Label>
                <Select
                  value={config.regime_tributario}
                  onValueChange={(value) => setConfig({ ...config, regime_tributario: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                    <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                    <SelectItem value="lucro_real">Lucro Real</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="anexo_simples">Anexo Simples</Label>
                <Select
                  value={config.anexo_simples}
                  onValueChange={(value) => setConfig({ ...config, anexo_simples: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="I">Anexo I - Comércio</SelectItem>
                    <SelectItem value="II">Anexo II - Indústria</SelectItem>
                    <SelectItem value="III">Anexo III - Serviços</SelectItem>
                    <SelectItem value="IV">Anexo IV - Serviços</SelectItem>
                    <SelectItem value="V">Anexo V - Serviços</SelectItem>
                    <SelectItem value="VI">Anexo VI - Serviços</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="iss_rate">Alíquota ISS (%)</Label>
                <Input
                  id="iss_rate"
                  type="number"
                  step="0.01"
                  value={config.iss_rate}
                  onChange={(e) => setConfig({ ...config, iss_rate: e.target.value })}
                  placeholder="Ex: 5.00"
                />
              </div>

              <div>
                <Label htmlFor="service_code">Código de Serviço</Label>
                <Input
                  id="service_code"
                  value={config.service_code}
                  onChange={(e) => setConfig({ ...config, service_code: e.target.value })}
                  placeholder="Ex: 05118"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="service_description">Descrição do Serviço</Label>
                <Input
                  id="service_description"
                  value={config.service_description}
                  onChange={(e) => setConfig({ ...config, service_description: e.target.value })}
                  placeholder="Ex: Atendimento psicológico individual"
                />
              </div>

              <div>
                <Label htmlFor="focusnfe_token_homologacao">Token FocusNFe (Homologação)</Label>
                <Input
                  id="focusnfe_token_homologacao"
                  type="password"
                  value={config.focusnfe_token_homologacao}
                  onChange={(e) => setConfig({ ...config, focusnfe_token_homologacao: e.target.value })}
                  placeholder="Token de teste"
                />
              </div>

              <div>
                <Label htmlFor="focusnfe_token_production">Token FocusNFe (Produção)</Label>
                <Input
                  id="focusnfe_token_production"
                  type="password"
                  value={config.focusnfe_token_production}
                  onChange={(e) => setConfig({ ...config, focusnfe_token_production: e.target.value })}
                  placeholder="Token de produção"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="focusnfe_environment">Ambiente</Label>
                <Select
                  value={config.focusnfe_environment}
                  onValueChange={(value) => setConfig({ ...config, focusnfe_environment: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homologacao">Homologação (Testes)</SelectItem>
                    <SelectItem value="producao">Produção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleSaveFiscalData} disabled={loading} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar Dados Fiscais'}
            </Button>
          </TabsContent>

          <TabsContent value="certificate" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="certificate_type">Tipo de Certificado</Label>
                <Select
                  value={certificate.certificate_type}
                  onValueChange={(value) => setCertificate({ ...certificate, certificate_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1 (arquivo .pfx)</SelectItem>
                    <SelectItem value="A3">A3 (token/cartão)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="certificate_file">Arquivo do Certificado (.pfx)</Label>
                <Input
                  id="certificate_file"
                  type="file"
                  accept=".pfx,.p12"
                  onChange={handleFileChange}
                />
                {certificate.certificate_file && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Arquivo selecionado: {certificate.certificate_file.name}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="certificate_password">Senha do Certificado</Label>
                <Input
                  id="certificate_password"
                  type="password"
                  value={certificate.certificate_password}
                  onChange={(e) => setCertificate({ ...certificate, certificate_password: e.target.value })}
                  placeholder="Digite a senha do certificado"
                />
              </div>

              <div>
                <Label>Data de Validade</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !certificate.valid_until && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {certificate.valid_until ? (
                        format(new Date(certificate.valid_until), 'PPP', { locale: ptBR })
                      ) : (
                        <span>Selecione a data de validade</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={certificate.valid_until ? new Date(certificate.valid_until) : undefined}
                      onSelect={(date) => setCertificate({ 
                        ...certificate, 
                        valid_until: date ? format(date, 'yyyy-MM-dd') : '' 
                      })}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button onClick={handleSaveCertificate} disabled={loading} className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar Certificado'}
            </Button>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
