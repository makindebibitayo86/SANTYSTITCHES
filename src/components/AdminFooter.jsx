function AdminFooter() {
  return (
    <footer className="border-t border-black/10 px-6 py-5 dark:border-white/10 md:px-10">
      <div className="mx-auto flex max-w-[1300px] flex-wrap items-center justify-between gap-2 text-[0.65rem] uppercase tracking-widest text-black/40 dark:text-white/40">
        <span>&copy; {new Date().getFullYear()} Santy Stitches</span>
        <span>Admin panel</span>
      </div>
    </footer>
  );
}

export default AdminFooter;
