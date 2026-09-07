"use client";
import Link from "next/link"; import { usePathname } from "next/navigation"; import { useState } from "react";
import { LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, ListChecks, FileChartColumn, Settings, PanelLeftClose, PanelLeftOpen, PackageCheck } from "lucide-react";
const links=[['/','Dashboard',LayoutDashboard],['/entrada','Nova Entrada',ArrowDownToLine],['/retirada','Nova Retirada',ArrowUpFromLine],['/movimentacoes','Movimentações',ListChecks],['/relatorios','Relatórios',FileChartColumn],['/configuracoes','Configurações',Settings]] as const;
export function AppShell({children}:{children:React.ReactNode}){ const [open,setOpen]=useState(true); const path=usePathname(); return <div className={`shell ${open?'':'collapsed'}`}>
  <aside className="sidebar"><div className="brand"><span className="brand-icon"><PackageCheck/></span>{open&&<div><strong>Controle de Cestas</strong><small>Gestão de estoque</small></div>}</div>
    <nav>{links.map(([href,label,Icon])=><Link key={href} href={href} title={label} className={path===href?'active':''}><Icon size={20}/>{open&&<span>{label}</span>}</Link>)}</nav>
    <button className="collapse" onClick={()=>setOpen(!open)}>{open?<PanelLeftClose/>:<PanelLeftOpen/>}{open&&<span>Recolher menu</span>}</button>
  </aside><main className="main"><header><div><h1>Controle de Estoque de Cestas</h1><p>Gestão de entradas, retiradas e relatórios</p></div></header><div className="content">{children}</div></main></div> }
