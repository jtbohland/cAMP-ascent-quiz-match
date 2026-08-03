import { useState } from "react";
import { CAMP_GEAR, RESOURCE_TYPE_BADGES, type CampResource } from "@/data/camp-gear.js";

interface CampGearProps {
  quizId: string;
}

export default function CampGear({ quizId }: CampGearProps) {
  const resources = CAMP_GEAR[quizId];
  const [expanded, setExpanded] = useState(false);

  if (!resources || resources.length === 0) return null;

  // Show first 4 by default, expand to show all
  const PREVIEW_COUNT = 4;
  const hasMore = resources.length > PREVIEW_COUNT;
  const visibleResources = expanded ? resources : resources.slice(0, PREVIEW_COUNT);

  return (
    <div className="bg-white rounded-xl border border-emerald-200 p-5 shadow-sm">
      <h3 className="text-base font-bold text-slate-900 mb-1">
        🎒 cAMP Gear
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Questions in this quiz come from the resources in your Ascent Guide and your 🗺️ Review Ranger Report in the Clips app. Study up before you start!
      </p>

      <div className="space-y-2">
        {visibleResources.map((resource, i) => (
          <ResourceRow key={i} resource={resource} />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          {expanded
            ? "Show less"
            : `+ ${resources.length - PREVIEW_COUNT} more resources`}
        </button>
      )}
    </div>
  );
}

function ResourceRow({ resource }: { resource: CampResource }) {
  const badge = RESOURCE_TYPE_BADGES[resource.type] ?? {
    label: resource.type,
    bg: "bg-slate-100",
    text: "text-slate-600",
  };

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 py-1.5 group"
    >
      <span
        className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${badge.bg} ${badge.text} uppercase tracking-wide mt-0.5`}
      >
        {badge.label}
      </span>
      <span className="text-sm text-slate-700 group-hover:text-emerald-700 transition-colors leading-snug">
        {resource.label}
      </span>
    </a>
  );
}
