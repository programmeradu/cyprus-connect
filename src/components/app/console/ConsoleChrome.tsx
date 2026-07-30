"use client";

/**
 * The chrome every /app route shares: one top bar, one set of records.
 * Pages render only their own deck below it.
 */

import { ConsoleTopbar } from "./ConsoleTopbar";
import { useConsole } from "./ConsoleData";

export function ConsoleChrome() {
  const { data } = useConsole();
  return <ConsoleTopbar data={data} />;
}
