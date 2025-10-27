import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

import { ArrowLeft, FileText, Upload, Save, Shield, CalendarIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function NFSeConfig() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [configExists, setConfigExists] = useState(false);

  const [config, setConfig] = useState({
    inscricao_municipal: '',
    cnpj: '',
    razao_social: '',
    regime_tributario: 'simples_nacional',
    anexo_simples: 'V',
    iss_rate: '5.00',
    service_code: '05118',
    service_description: 'Atendimento psicológico individual',
    focusnfe_token: '',
    focusnfe_environment: 'homologacao',
  });

  const [certificate, setCertificate] = useState({
    certificate_type: 'A1',
    certificate_file: null as File | null,
    certificate_password: '',
    valid_until: '',
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('nfse_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading config:', error);
        return;
      }

      if (data) {
        setConfigExists(true);
        // Format CNPJ for display
        const formattedCnpj = data.cnpj 
          ? data.cnpj
              .replace(/^(\d{2})(\d)/, '$1.$2')
              .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
              .replace(/\.(\d{3})(\d)/, '.$1/$2')
              .replace(/(\d{4})(\d)/, '$1-$2')
          : '';
        
        setConfig({
          inscricao_municipal: data.inscricao_municipal || '',
          cnpj: formattedCnpj,
          razao_social: data.razao_social || '',
          regime_tributario: data.regime_tributario || 'simples_nacional',
          anexo_simples: data.anexo_simples || 'V',
          iss_rate: data.iss_rate?.toString() || '5.00',
          service_code: data.service_code || '05118',
          service_description: data.service_description || 'Atendimento psicológico individual',
          focusnfe_token: data.focusnfe_token || '',
          focusnfe_environment: data.focusnfe_environment || 'homologacao',
        });
      }

      // Load certificate info
      const { data: certData } = await supabase
        .from('nfse_certificates')
        .select('certificate_type, valid_until')
        .eq('user_id', user.id)
        .single();

      if (certData) {
        setCertificate(prev => ({
          ...prev,
          certificate_type: certData.certificate_type || 'A1',
          valid_until: certData.valid_until || '',
        }));
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Encrypt the FocusNFe token before saving
      let encryptedToken = config.focusnfe_token;
      if (config.focusnfe_token) {
        const { data: encryptData, error: encryptError } = await supabase.functions.invoke(
          'encrypt-credential',
          {
            body: { plaintext: config.focusnfe_token },
          }
        );

        if (encryptError) {
          console.error('Encryption error:', encryptError);
          throw new Error('Erro ao encriptar credenciais');
        }

        encryptedToken = encryptData.encrypted;
      }

      const configData = {
        user_id: user.id,
        inscricao_municipal: config.inscricao_municipal.replace(/\D/g, ''),
        cnpj: config.cnpj.replace(/\D/g, ''),
        razao_social: config.razao_social,
        regime_tributario: config.regime_tributario,
        anexo_simples: config.anexo_simples,
        iss_rate: parseFloat(config.iss_rate),
        service_code: config.service_code,
        service_description: config.service_description,
        focusnfe_token: encryptedToken,
        focusnfe_environment: config.focusnfe_environment,
      };

      if (configExists) {
        const { error } = await supabase
          .from('nfse_config')
          .update(configData)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('nfse_config')
          .insert(configData);

        if (error) throw error;
        setConfigExists(true);
      }

      toast({
        title: 'Configurações salvas',
        description: 'As configurações fiscais foram encriptadas e salvas com segurança.',
      });
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCertificateUpload = async () => {
    if (!certificate.certificate_file || !certificate.certificate_password) {
      toast({
        title: 'Dados incompletos',
        description: 'Por favor, selecione o arquivo e informe a senha do certificado.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(certificate.certificate_file);
      
      reader.onload = async () => {
        const base64Data = reader.result as string;

        // Encrypt certificate data and password
        const { data: encryptedData, error: encryptDataError } = await supabase.functions.invoke(
          'encrypt-credential',
          {
            body: { plaintext: base64Data },
          }
        );

        const { data: encryptedPassword, error: encryptPasswordError } = await supabase.functions.invoke(
          'encrypt-credential',
          {
            body: { plaintext: certificate.certificate_password },
          }
        );

        if (encryptDataError || encryptPasswordError) {
          throw new Error('Erro ao encriptar certificado');
        }

        const certData = {
          user_id: user.id,
          certificate_data: encryptedData.encrypted,
          certificate_password: encryptedPassword.encrypted,
          certificate_type: certificate.certificate_type,
          valid_until: certificate.valid_until || null,
        };

        const { data: existing } = await supabase
          .from('nfse_certificates')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (existing) {
          const { error } = await supabase
            .from('nfse_certificates')
            .update(certData)
            .eq('user_id', user.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('nfse_certificates')
            .insert(certData);

          if (error) throw error;
        }

        toast({
          title: 'Certificado salvo',
          description: 'O certificado digital foi armazenado com segurança.',
        });

        setCertificate(prev => ({
          ...prev,
          certificate_file: null,
          certificate_password: '',
        }));
      };

      reader.onerror = () => {
        throw new Error('Erro ao ler o arquivo do certificado');
      };
    } catch (error: any) {
      console.error('Error uploading certificate:', error);
      toast({
        title: 'Erro ao salvar certificado',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Configuração NFSe</h1>
              <p className="text-muted-foreground">Configure os dados fiscais para emissão de notas</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="fiscal" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fiscal">Dados Fiscais</TabsTrigger>
            <TabsTrigger value="certificate">Certificado Digital</TabsTrigger>
          </TabsList>

          <TabsContent value="fiscal">
            <Card className="p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
                  <Input
                    id="inscricao_municipal"
                    value={config.inscricao_municipal}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setConfig({ ...config, inscricao_municipal: value });
                    }}
                    placeholder="Ex: 12345678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={config.cnpj}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 14) {
                        value = value
                          .replace(/^(\d{2})(\d)/, '$1.$2')
                          .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                          .replace(/\.(\d{3})(\d)/, '.$1/$2')
                          .replace(/(\d{4})(\d)/, '$1-$2');
                      }
                      setConfig({ ...config, cnpj: value });
                    }}
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="razao_social">Razão Social</Label>
                  <Input
                    id="razao_social"
                    value={config.razao_social}
                    onChange={(e) => setConfig({ ...config, razao_social: e.target.value })}
                    placeholder="Nome da clínica/profissional"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regime_tributario">Regime Tributário</Label>
                  <Select value={config.regime_tributario} onValueChange={(value) => setConfig({ ...config, regime_tributario: value })}>
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

                <div className="space-y-2">
                  <Label htmlFor="anexo_simples">Anexo do Simples Nacional</Label>
                  <Select value={config.anexo_simples} onValueChange={(value) => setConfig({ ...config, anexo_simples: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o anexo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="I">Anexo I</SelectItem>
                      <SelectItem value="III">Anexo III</SelectItem>
                      <SelectItem value="V">Anexo V</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="iss_rate">Alíquota ISS (%)</Label>
                  <Input
                    id="iss_rate"
                    type="number"
                    step="0.01"
                    value={config.iss_rate}
                    onChange={(e) => setConfig({ ...config, iss_rate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_code">Código de Serviço</Label>
                  <Input
                    id="service_code"
                    value={config.service_code}
                    onChange={(e) => setConfig({ ...config, service_code: e.target.value })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="service_description">Descrição do Serviço</Label>
                  <Input
                    id="service_description"
                    value={config.service_description}
                    onChange={(e) => setConfig({ ...config, service_description: e.target.value })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="focusnfe_token">Token API FocusNFe</Label>
                  <Input
                    id="focusnfe_token"
                    type="password"
                    value={config.focusnfe_token}
                    onChange={(e) => setConfig({ ...config, focusnfe_token: e.target.value })}
                    placeholder="Cole aqui o token da API"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="focusnfe_environment">Ambiente</Label>
                  <Select value={config.focusnfe_environment} onValueChange={(value) => setConfig({ ...config, focusnfe_environment: value })}>
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

              <div className="mt-6 flex justify-end">
                <Button onClick={handleSaveConfig} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="certificate">
            <Card className="p-6">
              <div className="space-y-6">
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">🔒 Segurança Implementada</p>
                    <p className="text-sm text-muted-foreground">
                      Todas as credenciais fiscais (token FocusNFe, certificados e senhas) são automaticamente 
                      encriptadas usando AES-GCM 256-bit antes de serem armazenadas. A chave de encriptação 
                      está protegida no Supabase Vault e nunca sai do servidor.
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="certificate_type">Tipo de Certificado</Label>
                    <Select value={certificate.certificate_type} onValueChange={(value) => setCertificate({ ...certificate, certificate_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A1">A1 (arquivo .pfx/.p12)</SelectItem>
                        <SelectItem value="A3">A3 (token/cartão)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valid_until">Válido até</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !certificate.valid_until && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {certificate.valid_until ? (
                            format(new Date(certificate.valid_until), "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={certificate.valid_until ? new Date(certificate.valid_until) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setCertificate({ 
                                ...certificate, 
                                valid_until: format(date, "yyyy-MM-dd")
                              });
                            }
                          }}
                          locale={ptBR}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {certificate.certificate_type === 'A1' && (
                    <>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="certificate_file">Arquivo do Certificado (.pfx ou .p12)</Label>
                        <Input
                          id="certificate_file"
                          type="file"
                          accept=".pfx,.p12"
                          onChange={(e) => setCertificate({ ...certificate, certificate_file: e.target.files?.[0] || null })}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="certificate_password">Senha do Certificado</Label>
                        <Input
                          id="certificate_password"
                          type="password"
                          value={certificate.certificate_password}
                          onChange={(e) => setCertificate({ ...certificate, certificate_password: e.target.value })}
                          placeholder="Senha fornecida pela Autoridade Certificadora"
                        />
                      </div>
                    </>
                  )}
                </div>

                {certificate.certificate_type === 'A1' && (
                  <div className="flex justify-end">
                    <Button onClick={handleCertificateUpload} disabled={loading}>
                      <Upload className="mr-2 h-4 w-4" />
                      {loading ? 'Enviando...' : 'Salvar Certificado'}
                    </Button>
                  </div>
                )}

                {certificate.certificate_type === 'A3' && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Para certificados A3 (token/cartão), a integração com FocusNFe será feita diretamente 
                      através do hardware. Certifique-se de que o token esteja conectado ao realizar emissões.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}