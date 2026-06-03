export type CalendarBlock = {
  day: number;
  type: "busy" | "request" | "blocked" | "free";
  label?: string;
};
