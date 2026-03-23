"use client";

import { useState, FormEvent } from "react";

interface OpportunityFormData {
  company: string;
  role: string;
  jdLink: string;
  compMin: string;
  compMax: string;
  location: string;
  remote: boolean;
  fitScore: string;
  priority: string;
  tier: string;
  source: string;
  status: string;
  notes: string;
}

interface AddOpportunityFormProps {
  onSubmit: (data: OpportunityFormData) => void;
  onCancel: () => void;
}

const INITIAL_STATE: OpportunityFormData = {
  company: "",
  role: "",
  jdLink: "",
  compMin: "",
  compMax: "",
  location: "",
  remote: false,
  fitScore: "",
  priority: "medium",
  tier: "2",
  source: "direct",
  status: "saved",
  notes: "",
};

const inputClasses = `
  w-full rounded-lg border border-[#2a2a3a] bg-[#111118] px-3 py-2
  text-sm text-[#e2e8f0] placeholder-[#64748b]
  transition-colors
  focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30
`;

const labelClasses = "block text-xs font-medium text-[#94a3b8] mb-1.5";

const selectClasses = `
  w-full rounded-lg border border-[#2a2a3a] bg-[#111118] px-3 py-2
  text-sm text-[#e2e8f0] appearance-none
  transition-colors cursor-pointer
  focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30
`;

export default function AddOpportunityForm({ onSubmit, onCancel }: AddOpportunityFormProps) {
  const [form, setForm] = useState<OpportunityFormData>(INITIAL_STATE);

  const update = (field: keyof OpportunityFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Company + Role (required) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="opp-company" className={labelClasses}>
            Company <span className="text-pipeline-rejected">*</span>
          </label>
          <input
            id="opp-company"
            type="text"
            required
            placeholder="e.g. Anthropic"
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="opp-role" className={labelClasses}>
            Role <span className="text-pipeline-rejected">*</span>
          </label>
          <input
            id="opp-role"
            type="text"
            required
            placeholder="e.g. BD, Strategic Partnerships"
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
            className={inputClasses}
          />
        </div>
      </div>

      {/* JD Link */}
      <div>
        <label htmlFor="opp-jd" className={labelClasses}>JD Link</label>
        <input
          id="opp-jd"
          type="url"
          placeholder="https://..."
          value={form.jdLink}
          onChange={(e) => update("jdLink", e.target.value)}
          className={inputClasses}
        />
      </div>

      {/* Comp range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="opp-comp-min" className={labelClasses}>Comp Min ($)</label>
          <input
            id="opp-comp-min"
            type="number"
            min={0}
            placeholder="e.g. 180000"
            value={form.compMin}
            onChange={(e) => update("compMin", e.target.value)}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="opp-comp-max" className={labelClasses}>Comp Max ($)</label>
          <input
            id="opp-comp-max"
            type="number"
            min={0}
            placeholder="e.g. 250000"
            value={form.compMax}
            onChange={(e) => update("compMax", e.target.value)}
            className={inputClasses}
          />
        </div>
      </div>

      {/* Location + Remote */}
      <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
        <div>
          <label htmlFor="opp-location" className={labelClasses}>Location</label>
          <input
            id="opp-location"
            type="text"
            placeholder="e.g. San Francisco, CA"
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            className={inputClasses}
          />
        </div>
        <label className="flex items-center gap-2 pb-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.remote}
            onChange={(e) => update("remote", e.target.checked)}
            className="
              h-4 w-4 rounded border-[#2a2a3a] bg-[#111118]
              text-indigo-500 focus:ring-indigo-500/30 focus:ring-offset-0
              cursor-pointer
            "
          />
          <span className="text-xs text-[#94a3b8]">Remote</span>
        </label>
      </div>

      {/* Fit Score + Priority + Tier */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor="opp-fit" className={labelClasses}>Fit Score (0-100)</label>
          <input
            id="opp-fit"
            type="number"
            min={0}
            max={100}
            placeholder="85"
            value={form.fitScore}
            onChange={(e) => update("fitScore", e.target.value)}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="opp-priority" className={labelClasses}>Priority</label>
          <div className="relative">
            <select
              id="opp-priority"
              value={form.priority}
              onChange={(e) => update("priority", e.target.value)}
              className={selectClasses}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown />
          </div>
        </div>
        <div>
          <label htmlFor="opp-tier" className={labelClasses}>Tier</label>
          <div className="relative">
            <select
              id="opp-tier"
              value={form.tier}
              onChange={(e) => update("tier", e.target.value)}
              className={selectClasses}
            >
              <option value="1">Tier 1</option>
              <option value="2">Tier 2</option>
              <option value="3">Tier 3</option>
            </select>
            <ChevronDown />
          </div>
        </div>
      </div>

      {/* Source + Status */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="opp-source" className={labelClasses}>Source</label>
          <div className="relative">
            <select
              id="opp-source"
              value={form.source}
              onChange={(e) => update("source", e.target.value)}
              className={selectClasses}
            >
              <option value="referral">Referral</option>
              <option value="direct">Direct</option>
              <option value="recruiter">Recruiter</option>
              <option value="job_board">Job Board</option>
            </select>
            <ChevronDown />
          </div>
        </div>
        <div>
          <label htmlFor="opp-status" className={labelClasses}>Status</label>
          <div className="relative">
            <select
              id="opp-status"
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
              className={selectClasses}
            >
              <option value="saved">Saved</option>
              <option value="applied">Applied</option>
              <option value="interviewing">Interviewing</option>
            </select>
            <ChevronDown />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="opp-notes" className={labelClasses}>Notes</label>
        <textarea
          id="opp-notes"
          rows={3}
          placeholder="Any initial notes..."
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          className={`${inputClasses} resize-none`}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2.5 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="
            rounded-lg border border-[#2a2a3a] px-4 py-2
            text-sm font-medium text-[#94a3b8]
            transition-colors
            hover:bg-[#1a1a24] hover:text-[#e2e8f0]
          "
        >
          Cancel
        </button>
        <button
          type="submit"
          className="
            rounded-lg bg-indigo-600 px-4 py-2
            text-sm font-medium text-white
            transition-colors
            hover:bg-indigo-500
            focus:outline-none focus:ring-2 focus:ring-indigo-500/40
          "
        >
          Add Opportunity
        </button>
      </div>
    </form>
  );
}

/** Small chevron icon for custom select dropdowns */
function ChevronDown() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
      <svg className="h-3.5 w-3.5 text-[#64748b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
