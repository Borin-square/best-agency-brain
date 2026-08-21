export interface NavItem {
  id: string;
  label: string;
  href?: string;
  children?: NavItem[];
  icon?: string;
}

export const MAIN_NAV: NavItem[] = [
  { id: "overview", label: "Overview", href: "/", icon: "◎" },
  { id: "agenzie", label: "Agenzie", href: "/agenzie", icon: "◫" },
  { id: "agents", label: "Agents", href: "/agents", icon: "◈" },
  { id: "network", label: "Network", href: "/network", icon: "◐" },
  { id: "seo", label: "SEO", href: "/seo", icon: "↗" },
  { id: "crm", label: "CRM", href: "/crm", icon: "✉" },
  { id: "content", label: "Content", href: "/content", icon: "☰" },
];

export const FOOTER_NAV: NavItem[] = [
  { id: "settings", label: "Settings", href: "/settings", icon: "⚙" },
];
