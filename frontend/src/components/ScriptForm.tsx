import { useState } from "react";

type ScriptFormProps = {
  onAnalyze: (script: string) => void;
  isLoading: boolean;
};

function ScriptForm({ onAnalyze, isLoading }: ScriptFormProps) {
  const [script, setScript] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedScript = script.trim();

    if (!cleanedScript) {
      return;
    }

    onAnalyze(cleanedScript);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-xl border border-slate-800 bg-slate-900 p-6"
    >
      <label
        htmlFor="script"
        className="mb-2 block text-sm font-semibold text-slate-200"
      >
        Video Script
      </label>

      <textarea
        id="script"
        value={script}
        onChange={(event) => setScript(event.target.value)}
        placeholder="Paste your YouTube video script here..."
        rows={10}
        className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-4 text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
      />

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {script.length} characters
        </p>

        <button
          type="submit"
          disabled={isLoading || !script.trim()}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Analyzing..." : "Analyze Script"}
        </button>
      </div>
    </form>
  );
}

export default ScriptForm;