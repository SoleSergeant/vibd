import { TaskDifficulty, TaskRewardType, TaskVisibility } from "@prisma/client";
import { formValue, parseBooleanString, parseDateOrDefault, parseEnum, parseIntInRange, splitCsv } from "@/lib/forms";

/** Parses and validates the create/edit task form. Returns null when required fields are missing. */
export function parseTaskForm(form: FormData) {
  const title = formValue(form.get("title"), 200);
  const description = formValue(form.get("description"), 10_000);
  if (!title || !description) return null;

  const rewardType = parseEnum(TaskRewardType, formValue(form.get("rewardType")), TaskRewardType.EXPERIENCE);
  const stipendAmount = parseIntInRange(formValue(form.get("stipendAmount")), 0, 1_000_000);

  return {
    title,
    description,
    category: formValue(form.get("category"), 80) || "General",
    requiredSkills: splitCsv(formValue(form.get("requiredSkills"))),
    difficulty: parseEnum(TaskDifficulty, formValue(form.get("difficulty")), TaskDifficulty.MEDIUM),
    rewardType,
    deadline: parseDateOrDefault(formValue(form.get("deadline"))),
    stipendAmount: stipendAmount || null,
    visibility: parseEnum(TaskVisibility, formValue(form.get("visibility")), TaskVisibility.PUBLIC),
    location: formValue(form.get("location"), 120) || null,
    isRemote: parseBooleanString(formValue(form.get("isRemote")) || "true")
  };
}
