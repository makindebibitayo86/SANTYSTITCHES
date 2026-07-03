function NavItem({ item, active, onNavigate }) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.key)}
      title={item.label}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 border-l-2 px-4 py-3 text-xs uppercase tracking-widest transition-colors md:px-5 ${
        active
          ? "border-black text-black dark:border-white dark:text-white"
          : "border-transparent text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
      }`}
    >
      <span className="shrink-0 md:hidden">{item.mobileIcon || item.icon}</span>
      <span className="hidden shrink-0 md:inline-flex">{item.icon}</span>
      {/* Labels only from md breakpoint up — mobile sidebar is icon-only */}
      <span className="hidden md:inline">{item.label}</span>
    </button>
  );
}

// Pure section nav — logo, "Admin" label, view-site link, log out, and the
// theme toggle now all live in the top AdminNavbar bar instead.
function AdminSidebar({ navItems, activeKey, onNavigate }) {
  return (
    <aside className="sticky top-20 flex min-h-[calc(100vh-5rem)] w-16 shrink-0 flex-col border-r border-black/10 bg-white dark:border-white/10 dark:bg-black md:w-56">
      <nav className="flex flex-col py-2">
        {navItems.map((item) => (
          <NavItem
            key={item.key}
            item={item}
            active={activeKey === item.key}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </aside>
  );
}

export default AdminSidebar;
