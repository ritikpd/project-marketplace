import { useState } from "react";
import { Send, MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/react";
import {
  useListConversations, getListConversationsQueryKey,
  useGetMessages, getGetMessagesQueryKey,
  useSendMessage,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

function formatTime(iso: string | null | undefined, t: (k: string, opts?: any) => string) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return t("messages.justNow");
  if (diff < 3600000) return t("messages.mAgo", { n: Math.floor(diff / 60000) });
  if (diff < 86400000) return t("messages.hAgo", { n: Math.floor(diff / 3600000) });
  return d.toLocaleDateString();
}

export default function Messages() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [selectedConv, setSelectedConv] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const { t } = useTranslation();

  const { data: conversations, isLoading: convsLoading } = useListConversations();
  const { data: messages, isLoading: msgsLoading } = useGetMessages(selectedConv!, {
    query: { queryKey: getGetMessagesQueryKey(selectedConv!), enabled: !!selectedConv }
  });

  const sendMessage = useSendMessage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey(selectedConv!) });
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        setMessage("");
      }
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedConv) return;
    sendMessage.mutate({ id: selectedConv, data: { content: message.trim() } });
  };

  const activeConv = (conversations ?? []).find((c: any) => c.id === selectedConv);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-2xl font-black text-white mb-6">{t("messages.title")}</h1>

        <div className="bg-card border border-white/5 rounded-2xl overflow-hidden flex" style={{ height: "calc(100vh - 16rem)" }}>
          {/* Conversations List */}
          <div className={`w-full sm:w-80 flex-shrink-0 border-r border-white/5 overflow-y-auto ${selectedConv ? "hidden sm:flex flex-col" : "flex flex-col"}`}>
            <div className="p-4 border-b border-white/5">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("messages.conversations")}</p>
            </div>
            {convsLoading ? (
              <div className="p-4 space-y-3">
                {[0,1,2].map(i => <Skeleton key={i} className="h-16 w-full bg-white/5 rounded-xl" />)}
              </div>
            ) : !(conversations ?? []).length ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm">{t("messages.noConversations")}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{t("messages.noConversationsSub")}</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {(conversations ?? []).map((conv: any) => (
                  <button key={conv.id} onClick={() => setSelectedConv(conv.id)}
                    className={`w-full text-left px-4 py-4 hover:bg-white/3 transition-colors ${selectedConv === conv.id ? "bg-primary/10 border-r-2 border-primary" : ""}`}>
                    <div className="flex items-center gap-3">
                      {conv.otherPartyAvatar ? (
                        <img src={conv.otherPartyAvatar} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-blue-600/30 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {conv.otherPartyName?.charAt(0) ?? "?"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{conv.otherPartyName ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.listingTitle}</p>
                        {conv.lastMessage && (
                          <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{conv.lastMessage}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground/50 flex-shrink-0">{formatTime(conv.lastMessageAt, t)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Message Thread */}
          <div className={`flex-1 flex flex-col ${selectedConv ? "flex" : "hidden sm:flex"}`}>
            {!selectedConv ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
                <p className="text-muted-foreground">{t("messages.selectConversation")}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedConv(null)}
                    className="sm:hidden text-muted-foreground hover:text-white h-8 w-8">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-blue-600/30 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {activeConv?.otherPartyName?.charAt(0) ?? "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{activeConv?.otherPartyName}</p>
                    <p className="text-xs text-muted-foreground truncate">{activeConv?.listingTitle}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {msgsLoading ? (
                    <div className="space-y-3">
                      {[0,1,2].map(i => <Skeleton key={i} className="h-12 w-2/3 bg-white/5 rounded-xl" />)}
                    </div>
                  ) : !(messages ?? []).length ? (
                    <div className="text-center text-muted-foreground text-sm pt-8">{t("messages.noMessages")}</div>
                  ) : (
                    (messages ?? []).map((msg: any) => {
                      const isMe = msg.senderId === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-primary text-white rounded-br-sm" : "bg-white/8 text-white rounded-bl-sm border border-white/5"}`}>
                            <p>{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isMe ? "text-white/60" : "text-muted-foreground"}`}>{formatTime(msg.createdAt, t)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSend} className="flex gap-3 p-4 border-t border-white/5">
                  <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("messages.typePlaceholder")}
                    className="flex-1 bg-card border-white/10 text-white placeholder:text-muted-foreground rounded-xl h-11" />
                  <Button type="submit" disabled={!message.trim() || sendMessage.isPending}
                    className="bg-primary hover:bg-primary/90 text-white rounded-xl h-11 px-4">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
