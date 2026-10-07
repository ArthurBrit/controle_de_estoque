"use client";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollExtras() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <>
    <div className="scroll-progress" aria-hidden="true" />
    <button type="button" className={`to-top ${show ? "show" : ""}`} aria-label="Voltar ao topo" title="Voltar ao topo" onClick={() => window.scrollTo({ top: 0 })}><ArrowUp size={20} /></button>
  </>;
}
