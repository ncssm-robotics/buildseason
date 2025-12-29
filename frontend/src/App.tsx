function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-10">
        <h1 className="text-4xl font-bold text-foreground">BuildSeason</h1>
        <p className="mt-4 text-muted-foreground">
          React + Vite + Tailwind + shadcn/ui scaffold ready.
        </p>
        <div className="mt-8 flex gap-4">
          <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
            Primary Button
          </button>
          <button className="rounded-md bg-secondary px-4 py-2 text-secondary-foreground hover:bg-secondary/90">
            Secondary Button
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
