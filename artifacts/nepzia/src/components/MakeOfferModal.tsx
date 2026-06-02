import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMakeOffer, getGetMyOffersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tag, X, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface MakeOfferModalProps {
  listingId: number;
  listingTitle: string;
  askingPrice: number;
  onClose: () => void;
}

export function MakeOfferModal({ listingId, listingTitle, askingPrice, onClose }: MakeOfferModalProps) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(String(Math.round(askingPrice * 0.9)));
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const { t } = useTranslation();

  const makeOffer = useMakeOffer({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyOffersQueryKey() });
        setDone(true);
      },
    },
  });

  const pct = askingPrice > 0 ? Math.round((Number(amount) / askingPrice) * 100) : 0;

  const offerStrength = pct < 70
    ? t("offer.lowOffer")
    : pct < 85
    ? t("offer.fairOffer")
    : t("offer.strongOffer");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-[#0a0f1d] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-white">
          <X className="h-5 w-5" />
        </button>

        {done ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">{t("offer.offerSent")}</h3>
            <p className="text-muted-foreground text-sm mb-5">{t("offer.offerSentSub")}</p>
            <Button onClick={onClose} className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8">{t("offer.done")}</Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-5">
              <Tag className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-white">{t("offer.title")}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5 truncate">
              <span className="text-white font-medium">{listingTitle}</span>
              <span className="ml-2 text-muted-foreground/60">{t("offer.askingPrice")} {askingPrice.toLocaleString()}</span>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground mb-2">{t("offer.yourOffer")}</label>
              <Input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="bg-background border-white/10 text-white text-xl font-bold h-14 rounded-xl"
                min="1"
              />
              {amount && (
                <div className="flex justify-between mt-2 text-xs">
                  <span className={pct >= 90 ? "text-emerald-400" : pct >= 75 ? "text-yellow-400" : "text-red-400"}>
                    {pct}{t("offer.pctOfAsking")}
                  </span>
                  <span className="text-muted-foreground">{offerStrength}</span>
                </div>
              )}
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-muted-foreground mb-2">{t("offer.message")}</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t("offer.messagePlaceholder")}
                rows={2}
                className="w-full bg-background border border-white/10 text-white placeholder:text-muted-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1 border-white/10 text-muted-foreground hover:text-white h-11 rounded-xl">
                {t("offer.cancel")}
              </Button>
              <Button
                onClick={() => makeOffer.mutate({ id: listingId, data: { amount: Number(amount), message: message || undefined } })}
                disabled={!amount || Number(amount) <= 0 || makeOffer.isPending}
                className="flex-1 bg-primary hover:bg-primary/90 text-white h-11 rounded-xl font-semibold shadow-lg shadow-primary/20"
              >
                {makeOffer.isPending ? t("offer.sending") : t("offer.sendOffer")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
