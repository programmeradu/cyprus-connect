"use client";

/**
 * Home's short way into "Add data": drop a file here or pick one, and the
 * page that reads and checks it opens with the file already on its way.
 *
 * The scene is decorative only: papers drop into the reader.
 */

import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ACCEPT, stashFiles } from "@/components/app/intake/pending-files";
import readerImage from "@/assets/intake-reader.png";

export function AddDataCard() {
  const t = useTranslations("dashboard.intake");
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const send = (files: File[]) => {
    if (files.length === 0) return;
    stashFiles(files.map((file) => ({ file })));
    router.push("/app/calculator");
  };

  return (
    <section
      className="vch-adddata"
      data-dragging={dragging || undefined}
      aria-labelledby="vch-adddata-title"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        send(Array.from(e.dataTransfer.files));
      }}
    >
      <div className="vch-adddata-stage" aria-hidden="true">
        <span className="vch-sheet" data-kind="bill">
          <i /><i /><i /><b />
        </span>
        <span className="vch-sheet" data-kind="statement">
          <i /><i /><i /><i />
        </span>
        <span className="vch-sheet" data-kind="sheet" />
        <Image src={readerImage} alt="" width={200} height={223} className="vch-adddata-reader" />
      </div>

      <div className="vch-adddata-copy">
        <h2 id="vch-adddata-title">{t("home.title")}</h2>
        <p>{t("home.body")}</p>
      </div>


      <button type="button" className="vch-btn" data-kind="primary" onClick={() => input.current?.click()}>
        {t("home.cta")}
      </button>
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => send(Array.from(e.target.files ?? []))}
      />
    </section>
  );
}
