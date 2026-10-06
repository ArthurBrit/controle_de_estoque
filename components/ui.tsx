"use client";
import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck, X } from "lucide-react";
export function Toast({message,type="success",onClose}:{message:string;type?:"success"|"error";onClose:()=>void}){useEffect(()=>{const t=setTimeout(onClose,4500);return()=>clearTimeout(t)},[onClose]);const Icon=type==="error"?CircleAlert:CircleCheck;return <div className={`toast ${type}`} role={type==="error"?"alert":"status"}><Icon size={20}/><span>{message}</span><button type="button" className="toast-close" aria-label="Fechar" onClick={onClose}><X size={16}/></button><i className="toast-timer"/></div>}
export function Loading(){return <div className="loading"><span/><p>Carregando informações...</p></div>}
export function Empty({text="Nenhuma movimentação encontrada."}:{text?:string}){return <div className="empty">{text}</div>}
export function Modal({title,children,onClose}:{title:string;children:React.ReactNode;onClose:()=>void}){return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={e=>e.stopPropagation()}><h2>{title}</h2>{children}</div></div>}
export function useToast(){const [toast,setToast]=useState<{message:string;type:"success"|"error"}|null>(null);return {show:(message:string,type:"success"|"error"="success")=>setToast({message,type}),node:toast?<Toast {...toast} onClose={()=>setToast(null)}/>:null}}
