import { ROLES, type Role } from "@/data/quiz-types.js";

interface RoleSelectorProps {
  value: Role | null;
  onChange: (role: Role) => void;
}

export default function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">What is your role?</label>
      <div className="grid grid-cols-2 gap-2">
        {ROLES.map((role) => (
          <button
            key={role}
            onClick={() => onChange(role)}
            className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
              value === role
                ? "border-blue-400 bg-blue-50 text-blue-700"
                : "border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50/50"
            }`}
          >
            {role}
          </button>
        ))}
      </div>
    </div>
  );
}
