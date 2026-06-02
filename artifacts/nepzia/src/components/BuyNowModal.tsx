import { useState } from "react";
import { X, CheckCircle2, Banknote, MessageSquare, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateConversation } from "@workspace/api-client-react";
import { useLocation } from "wouter";

const PAYMENT_METHODS = [
  { name: "eSewa", color: "text-emerald-400", border: "border-emerald-400/30", bg: "bg-emerald-400/10", logo: "📱" },
  { name: "Khalti", color: "text-purple-400", border: "border-purple-400/30", bg: "bg-purple-400/10", logo: "💜" },
  { name: "IME Pay", color: "text-blue-400", border: "border-blue-400/30", bg: "bg-blue-400/10", logo: "🔵" },
  { name: "Fonepay", color: "text-yellow-400", border: "border-yellow-400/30", bg: "bg-yellow-400/10", logo: "📲" },
  { name: "Cash on Meetup", color: "text-white", border: "border-white/20", bg: "bg-white/5", logo: "🤝" },
];

interface BuyNowModalProps {
  listingId: number;
  listingTitle: string;
  price: number;
  sellerId: string;
  onClose: () => void;
}

export function BuyNowModal({ listingId, listingTitle, price, sellerId, onClose }: BuyNowModalProps) {
  const [, setLocation] = useLocation();
  const [selectedPayment, setSelectedPayment] = useState("");
  const [step, setStep] = useState<"choose" | "confirm" | "done">("choose");
  const [copied, setCopied] = useState(false);

  const createConversation = useCreateConversation({
    mutation: {
      onSuccess: () => {
        setStep("done");
      },
    },
  });

  const handleConfirm = () => {
    if (!selectedPayment) return;
    createConversation.mutate({
      data: {
        listingId,
        sellerId,
        initialMessage: `Hi! I'd like to buy "${listingTitle}" for Rs. ${price.toLocaleString()} via ${selectedPayment}. Is it still available?`,
      },
    });
  };

  const handleCopyDetails = () => {
    navigator.clipboard.writeText(`Buy: ${listingTitle}\nPrice: Rs. ${price.toLocaleString()}\nPayment: ${selectedPayment}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-[#0a0f1d] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-primary/20 to-blue-600/10 p-6 border-b border-white/5">
          <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-white"><X className="h-5 w-5" /></button>
          <div className="flex items-center gap-3 mb-1">
            <Banknote className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-white">Buy Now</h2>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">{listingTitle}</p>
          <div className="text-3xl font-black text-white mt-2">Rs. {price.toLocaleString()}</div>
        </div>

        <div className="p-6">
          {step === "choose" && (
            <>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Choose Payment Method</p>
              <div className="space-y-2.5 mb-6">
                {PAYMENT_METHODS.map(m => (
                  <button key={m.name} onClick={() => setSelectedPayment(m.name)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                      selectedPayment === m.name
                        ? `${m.bg} ${m.border} ${m.color} font-semibold ring-1 ring-current/30`
                        : "border-white/5 hover:border-white/10 hover:bg-white/3 text-muted-foreground"
                    }`}>
                    <span className="text-xl">{m.logo}</span>
                    <span className="font-medium text-sm">{m.name}</span>
                    {selectedPayment === m.name && <Check className="h-4 w-4 ml-auto" />}
                  </button>
                ))}
              </div>
              <Button onClick={() => setStep("confirm")} disabled={!selectedPayment}
                className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-xl font-bold shadow-lg shadow-primary/20">
                Continue
              </Button>
            </>
          )}

          {step === "confirm" && (
            <>
              <div className="bg-white/3 border border-white/5 rounded-xl p-4 mb-5 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Item</span><span className="text-white font-medium truncate max-w-[180px]">{listingTitle}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span className="text-white font-bold">Rs. {price.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment via</span><span className="text-primary font-medium">{selectedPayment}</span></div>
              </div>
              <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
                A message will be sent to the seller with your preferred payment method to coordinate the transaction. Always meet in a public place.
              </p>
              <div className="flex gap-2.5">
                <Button variant="outline" onClick={() => setStep("choose")} className="flex-1 border-white/10 text-muted-foreground hover:text-white h-11 rounded-xl">Back</Button>
                <Button onClick={handleConfirm} disabled={createConversation.isPending}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white h-11 rounded-xl font-bold">
                  {createConversation.isPending ? "Sending..." : "Contact Seller"}
                </Button>
              </div>
            </>
          )}

          {step === "done" && (
            <div className="text-center py-4">
              <CheckCircle2 className="h-14 w-14 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
              <p className="text-sm text-muted-foreground mb-6">
                The seller has been notified. Check your messages to coordinate payment and pickup.
              </p>
              <div className="flex gap-2.5">
                <Button variant="outline" onClick={handleCopyDetails} className="flex-1 border-white/10 text-muted-foreground hover:text-white h-11 rounded-xl text-sm">
                  {copied ? <><Check className="h-4 w-4 mr-1.5 text-emerald-400" /> Copied</> : <><Copy className="h-4 w-4 mr-1.5" /> Copy Details</>}
                </Button>
                <Button onClick={() => { onClose(); setLocation("/dashboard/messages"); }}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white h-11 rounded-xl font-bold">
                  <MessageSquare className="h-4 w-4 mr-1.5" />
                  Messages
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
