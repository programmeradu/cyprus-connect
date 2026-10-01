"use client";

/**
 * Under the EAC and water tiles: the forwarding address for e-bills, and the
 * bank check (payments to the board with no bill, bills with no payment).
 * Presentational; the page passes the data and the actions.
 */

import type { BillPaymentCheck } from "@/lib/integrations/bill-match";
import type { BillInboxSummary } from "@/lib/integrations/bill-inbox.server";
import { Btn } from "@/components/app/console/kit";

type L = (en: string, el: string) => string;

export function BillPaymentsBlock({
  kind,
  check,
  L,
  date,
  eur2,
}: {
  kind: "water" | "electricity";
  check: BillPaymentCheck;
  L: L;
  date: Intl.DateTimeFormat;
  eur2: Intl.NumberFormat;
}) {
  const board = kind === "water" ? L("the water board", "το συμβούλιο υδατοπρομήθειας") : L("EAC", "την ΑΗΚ");
  if (!check.bankLinked) {
    return (
      <p className="vci-tile-note">
        {L(
          `Link a bank above and Vuneli checks every payment to ${board} against these bills, and asks for any bill that is missing.`,
          `Συνδέστε μια τράπεζα παραπάνω και η Vuneli ελέγχει κάθε πληρωμή προς ${board} με τους λογαριασμούς και ζητά όσους λείπουν.`,
        )}
      </p>
    );
  }
  const missing = check.paymentsWithoutBill;
  return (
    <div className="vci-billcheck">
      <p className="vci-billcheck-head">
        <span>{L("Bank check", "Έλεγχος τράπεζας")}</span>
        <span className="vck-num">
          {L(`${check.matched.length} paid · ${missing.length} without a bill`, `${check.matched.length} πληρωμένοι · ${missing.length} χωρίς λογαριασμό`)}
        </span>
      </p>
      {missing.length > 0 ? (
        <>
          <p className="vci-billcheck-ask">
            {L(
              `You paid ${board} on these dates, but the bill is not here yet. Forward or upload it so the figures are complete.`,
              `Πληρώσατε ${board} σε αυτές τις ημερομηνίες, αλλά ο λογαριασμός δεν είναι εδώ. Προωθήστε ή ανεβάστε τον για πλήρη στοιχεία.`,
            )}
          </p>
          <ul className="vci-bank-lines" aria-label={L("Payments without a bill", "Πληρωμές χωρίς λογαριασμό")}>
            {missing.slice(0, 6).map((p) => (
              <li key={p.id}>
                <span className="vci-bank-line-what">{date.format(new Date(p.bookedOn))}</span>
                <span className="vci-bank-line-why">{p.description || L("No description from the bank", "Χωρίς περιγραφή από την τράπεζα")}</span>
                <strong className="vck-num">{eur2.format(p.amount)}</strong>
              </li>
            ))}
          </ul>
          {missing.length > 6 && (
            <p className="vci-billcheck-more">{L(`and ${missing.length - 6} earlier`, `και ${missing.length - 6} παλαιότερες`)}</p>
          )}
        </>
      ) : (
        <p className="vci-billcheck-ask">
          {L(`Every payment to ${board} in the bank read has its bill.`, `Κάθε πληρωμή προς ${board} στην τράπεζα έχει τον λογαριασμό της.`)}
        </p>
      )}
      <p className="vci-billcheck-more">
        {L(
          `Bank read from ${check.coveredFrom ? date.format(new Date(check.coveredFrom)) : "—"}. A payment counts for a bill when it is made within 75 days after the period ends; the exact amount is preferred.`,
          `Τράπεζα από ${check.coveredFrom ? date.format(new Date(check.coveredFrom)) : "—"}. Μια πληρωμή αντιστοιχεί σε λογαριασμό όταν γίνει έως 75 ημέρες μετά το τέλος της περιόδου· προτιμάται το ακριβές ποσό.`,
        )}
      </p>
    </div>
  );
}

/** Short note for one bill line: paid on a date, or no payment in the bank. */
export function billPayNote(check: BillPaymentCheck | undefined, billId: number, L: L, date: Intl.DateTimeFormat): string | null {
  if (!check?.bankLinked) return null;
  const m = check.matched.find((x) => x.billId === billId);
  if (m) return m.amountMatches ? L(`paid ${date.format(new Date(m.bookedOn))}`, `πληρώθηκε ${date.format(new Date(m.bookedOn))}`) : L(`payment ${date.format(new Date(m.bookedOn))}, other amount`, `πληρωμή ${date.format(new Date(m.bookedOn))}, άλλο ποσό`);
  if (check.billsWithoutPayment.includes(billId)) return L("no payment in the bank", "καμία πληρωμή στην τράπεζα");
  return null;
}

export function BillInboxBlock({
  inbox,
  L,
  time,
  busy,
  onOpen,
  onRotate,
  onClose,
}: {
  inbox: BillInboxSummary;
  L: L;
  time: Intl.DateTimeFormat;
  busy: boolean;
  onOpen: () => void;
  onRotate: () => void;
  onClose: () => void;
}) {
  if (!inbox.ready) {
    return (
      <p className="vci-tile-note">
        {L(
          "Forwarding e-bills by email opens once the workspace owner sets up the bill inbox. Upload works now.",
          "Η προώθηση λογαριασμών με email ανοίγει όταν ο ιδιοκτήτης ρυθμίσει τα εισερχόμενα λογαριασμών. Το ανέβασμα λειτουργεί ήδη.",
        )}
      </p>
    );
  }
  if (!inbox.address) {
    return (
      <div className="vci-billcheck">
        <p className="vci-billcheck-head">
          <span>{L("Forward e-bills", "Προώθηση e-λογαριασμών")}</span>
        </p>
        <p className="vci-billcheck-ask">
          {L(
            "Get a private address, then set your email to auto-forward EAC and water board e-bills to it. Each bill is read when it arrives. One address serves both.",
            "Πάρτε μια ιδιωτική διεύθυνση και ρυθμίστε το email σας να προωθεί αυτόματα εκεί τους e-λογαριασμούς ΑΗΚ και νερού. Κάθε λογαριασμός διαβάζεται μόλις φτάσει. Μία διεύθυνση και για τα δύο.",
          )}
        </p>
        <div>
          <Btn variant="quiet" onClick={onOpen} disabled={busy}>
            {busy ? L("Making the address…", "Δημιουργία διεύθυνσης…") : L("Get my forwarding address", "Η διεύθυνση προώθησης")}
          </Btn>
        </div>
      </div>
    );
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inbox.address!);
    } catch {
      /* the address stays selectable */
    }
  };
  const added = inbox.lastResult.filter((r) => r.ok && !r.duplicate).length;
  return (
    <div className="vci-billcheck">
      <p className="vci-billcheck-head">
        <span>{L("Forward e-bills to", "Προώθηση e-λογαριασμών στο")}</span>
      </p>
      <div className="vci-inbox-addr">
        <code>{inbox.address}</code>
        <button type="button" className="vci-link-btn" onClick={copy}>
          {L("Copy", "Αντιγραφή")}
        </button>
      </div>
      <p className="vci-billcheck-more">
        {L(
          "In Gmail: Settings → Forwarding → Add a forwarding address, then a filter for mail from EAC and your water board. In Outlook: Rules → Forward to. The same address serves EAC and water.",
          "Στο Gmail: Ρυθμίσεις → Προώθηση → Προσθήκη διεύθυνσης, και φίλτρο για email από ΑΗΚ και το συμβούλιο νερού. Στο Outlook: Κανόνες → Προώθηση. Η ίδια διεύθυνση για ΑΗΚ και νερό.",
        )}
      </p>
      {inbox.confirmation && (
        <p className="vci-tile-note">
          {L("Gmail asked to confirm this address.", "Το Gmail ζήτησε επιβεβαίωση της διεύθυνσης.")}{" "}
          {inbox.confirmation.code && (
            <>
              {L("Code: ", "Κωδικός: ")}
              <strong className="vck-num">{inbox.confirmation.code}</strong>.{" "}
            </>
          )}
          {inbox.confirmation.link && (
            <a href={inbox.confirmation.link} target="_blank" rel="noopener noreferrer">
              {L("Open the confirmation", "Άνοιγμα επιβεβαίωσης")}
            </a>
          )}
        </p>
      )}
      {inbox.lastMessageAt && !inbox.confirmation && (
        <div className="vci-billcheck-last">
          <p className="vci-billcheck-more">
            {L(
              `Last email ${time.format(new Date(inbox.lastMessageAt))}${inbox.lastMessageFrom ? ` from ${inbox.lastMessageFrom}` : ""}: ${added === 1 ? "1 bill added" : `${added} bills added`}.`,
              `Τελευταίο email ${time.format(new Date(inbox.lastMessageAt))}${inbox.lastMessageFrom ? ` από ${inbox.lastMessageFrom}` : ""}: ${added} νέοι λογαριασμοί.`,
            )}
          </p>
          {inbox.lastResult.filter((r) => !r.ok || r.duplicate).map((r, i) => (
            <p key={i} className="vci-billcheck-more">
              {r.file}: {r.duplicate ? L("already added", "υπάρχει ήδη") : r.reason}
            </p>
          ))}
        </div>
      )}
      <p className="vci-billcheck-more">
        <button type="button" className="vci-link-btn" onClick={onRotate} disabled={busy}>
          {L("Get a new address", "Νέα διεύθυνση")}
        </button>
        {" · "}
        <button type="button" className="vci-link-btn" onClick={onClose} disabled={busy}>
          {L("Stop forwarding", "Διακοπή προώθησης")}
        </button>
      </p>
    </div>
  );
}
