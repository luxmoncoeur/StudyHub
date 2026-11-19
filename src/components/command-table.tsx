import type { Command } from "@/content/types";

const OS = { linux: "Linux", mac: "macOS", windows: "Windows", any: "" } as const;

export function CommandTable({ commands }: { commands: Command[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-white/5">
          {commands.map((c) => (
            <tr key={c.cmd + c.os} className="align-top">
              <td className="w-1/2 px-4 py-2.5">
                <code className="font-mono text-[12.5px] text-sky-300">{c.cmd}</code>
                {c.os && c.os !== "any" && <span className="ml-2 text-[10px] uppercase text-neutral-600">{OS[c.os]}</span>}
              </td>
              <td className="px-4 py-2.5 text-neutral-400">{c.purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
