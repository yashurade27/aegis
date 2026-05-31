'use client';

export function Footer() {
  return (
    <footer className="w-full bg-background border-t border-grid-line">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-margin-lg py-margin-md max-w-[1440px] mx-auto border-x border-grid-line">
        <div className="font-headline-lg text-headline-lg text-primary uppercase">AEGIS VAULT</div>
        <div className="flex flex-wrap justify-center gap-6 my-4 md:my-0">
          <a className="text-on-surface-variant font-label-mono text-label-mono uppercase hover:text-primary transition-colors" href="#">
            Legal
          </a>
          <a className="text-on-surface-variant font-label-mono text-label-mono uppercase hover:text-primary transition-colors" href="#">
            Privacy
          </a>
          <a className="text-on-surface-variant font-label-mono text-label-mono uppercase hover:text-primary transition-colors" href="#">
            Media Kit
          </a>
          <a className="text-on-surface-variant font-label-mono text-label-mono uppercase hover:text-primary transition-colors" href="#">
            Status
          </a>
          <a className="text-on-surface-variant font-label-mono text-label-mono uppercase hover:text-primary transition-colors" href="#">
            Security
          </a>
        </div>
        <div className="text-on-surface-variant font-label-mono text-label-mono uppercase text-center md:text-right text-xs">
          © 2026 AEGIS VAULT. INSTITUTIONAL GRADE SECURITY.
        </div>
      </div>
    </footer>
  );
}
