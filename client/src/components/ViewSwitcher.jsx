import { Segmented } from "antd";

const views = [
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
];

export default function ViewSwitcher({ view, onChange }) {
  return (
    <Segmented
      aria-label="Calendar view"
      options={views}
      value={view}
      onChange={onChange}
    />
  );
}
