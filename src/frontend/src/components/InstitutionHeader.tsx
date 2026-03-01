export default function InstitutionHeader() {
  return (
    <header className="flex items-center gap-4 px-4 sm:px-6 py-3 border-b border-border/60 bg-background/95 backdrop-blur-sm flex-shrink-0">
      <img
        src="/assets/generated/dance-studio-logo.dim_200x200.png"
        alt="No. 1 Dance Group Logo"
        className="w-10 h-10 sm:w-12 sm:h-12 object-contain flex-shrink-0"
      />
      <div>
        <h1 className="font-display text-lg sm:text-2xl font-extrabold text-primary leading-tight tracking-tight">
          No. 1 Dance Studio
        </h1>
        <p className="text-muted-foreground text-[10px] sm:text-xs font-medium tracking-widest uppercase mt-0.5">
          Management System
        </p>
      </div>
    </header>
  );
}
