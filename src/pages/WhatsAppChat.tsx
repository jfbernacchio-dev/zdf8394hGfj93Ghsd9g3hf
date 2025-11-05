import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, Clock, User, Trash2, Download, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Conversation {
  id: string;
  phone_number: string;
  contact_name: string | null;
  last_message_at: string;
  last_message_from: string;
  unread_count: number;
  window_expires_at: string | null;
  patient_id: string | null;
}

interface Message {
  id: string;
  direction: string;
  message_type: string;
  content: string;
  created_at: string;
  status: string;
  media_url: string | null;
}

export default function WhatsAppChat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [downloadingMedia, setDownloadingMedia] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markAsRead(selectedConversation.id);

      // Subscribe to new messages
      const channel = supabase
        .channel(`conversation-${selectedConversation.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "whatsapp_messages",
            filter: `conversation_id=eq.${selectedConversation.id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("whatsapp_conversations")
        .select("*")
        .eq("user_id", user?.id)
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      console.error("Error loading conversations:", error);
      toast.error("Erro ao carregar conversas");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error("Error loading messages:", error);
      toast.error("Erro ao carregar mensagens");
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await supabase
        .from("whatsapp_conversations")
        .update({ unread_count: 0 })
        .eq("id", conversationId);

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
        )
      );
    } catch (error: any) {
      console.error("Error marking as read:", error);
    }
  };

  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm("Tem certeza que deseja excluir esta conversa? Todas as mensagens serão perdidas.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("whatsapp_conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;

      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
      
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }

      toast.success("Conversa excluída com sucesso");
    } catch (error: any) {
      console.error("Error deleting conversation:", error);
      toast.error("Erro ao excluir conversa");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp-reply", {
        body: {
          conversationId: selectedConversation.id,
          message: newMessage.trim(),
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Erro ao enviar mensagem");
      }

      setNewMessage("");
      toast.success("Mensagem enviada!");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const isWindowExpired = (expiresAt: string | null) => {
    if (!expiresAt) return true;
    return new Date() > new Date(expiresAt);
  };

  const formatTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true,
      locale: ptBR 
    });
  };

  const downloadMedia = async (messageId: string) => {
    if (downloadingMedia.has(messageId)) return;

    setDownloadingMedia(prev => new Set(prev).add(messageId));

    try {
      console.log("Calling download-whatsapp-media for message:", messageId);
      
      const { data, error } = await supabase.functions.invoke("download-whatsapp-media", {
        body: { messageId },
      });

      console.log("Function response:", { data, error });

      if (error) {
        console.error("Function error details:", error);
        throw error;
      }

      if (data?.error) {
        console.error("Function returned error:", data.error);
        throw new Error(data.error);
      }

      if (data?.url) {
        console.log("Media URL received:", data.url);
        // Update local state
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId ? { ...msg, media_url: data.url } : msg
          )
        );
        toast.success("Mídia carregada!");
      } else {
        throw new Error("URL da mídia não recebida");
      }
    } catch (error: any) {
      console.error("Error downloading media:", error);
      console.error("Error details:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      toast.error(error?.message || "Erro ao carregar mídia");
    } finally {
      setDownloadingMedia(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }
  };

  const renderMessageContent = (msg: Message) => {
    const isDownloading = downloadingMedia.has(msg.id);
    const hasValidUrl = msg.media_url && msg.media_url.startsWith("http");

    if (msg.message_type === "image") {
      if (hasValidUrl) {
        return (
          <div className="space-y-2">
            <img 
              src={msg.media_url} 
              alt={msg.content} 
              className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(msg.media_url!, "_blank")}
            />
            {msg.content !== "📷 Imagem" && (
              <p className="text-sm">{msg.content}</p>
            )}
          </div>
        );
      } else {
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ImageIcon className="h-5 w-5" />
              <span className="text-sm">{msg.content}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadMedia(msg.id)}
              disabled={isDownloading}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? "Carregando..." : "Ver Imagem"}
            </Button>
          </div>
        );
      }
    }

    if (msg.message_type === "document" && hasValidUrl) {
      return (
        <div className="space-y-2">
          <p className="text-sm">{msg.content}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(msg.media_url!, "_blank")}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar Documento
          </Button>
        </div>
      );
    }

    return <p className="text-sm whitespace-pre-wrap break-all overflow-wrap-anywhere">{msg.content}</p>;
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Conversations List */}
      <Card className="w-80 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            WhatsApp
          </h2>
        </div>
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Carregando...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Nenhuma conversa ainda
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 flex items-start gap-3 border-b hover:bg-accent transition-colors ${
                  selectedConversation?.id === conv.id ? "bg-accent" : ""
                }`}
              >
                <Avatar>
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium break-words">
                      {conv.contact_name || conv.phone_number}
                    </p>
                    {conv.unread_count > 0 && (
                      <Badge variant="default" className="text-xs shrink-0">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground break-words">
                    {conv.phone_number}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTime(conv.last_message_at)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={(e) => deleteConversation(conv.id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </button>
            ))
          )}
        </ScrollArea>
      </Card>

      {/* Messages Area */}
      <Card className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  {selectedConversation.contact_name || selectedConversation.phone_number}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedConversation.phone_number}
                </p>
              </div>
              {selectedConversation.window_expires_at && (
                <Badge
                  variant={isWindowExpired(selectedConversation.window_expires_at) ? "destructive" : "secondary"}
                  className="flex items-center gap-1"
                >
                  <Clock className="h-3 w-3" />
                  {isWindowExpired(selectedConversation.window_expires_at)
                    ? "Janela expirada"
                    : `${formatTime(selectedConversation.window_expires_at)}`}
                </Badge>
              )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.direction === "outbound"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {renderMessageContent(msg)}
                      <p
                        className={`text-xs mt-1 ${
                          msg.direction === "outbound"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t">
              {isWindowExpired(selectedConversation.window_expires_at) ? (
                <div className="text-center text-sm text-muted-foreground">
                  A janela de 24h expirou. Só é possível enviar templates aprovados.
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Digite sua mensagem..."
                    disabled={sending}
                  />
                  <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecione uma conversa para começar</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
