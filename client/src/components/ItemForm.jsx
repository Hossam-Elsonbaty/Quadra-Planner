import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Modal, Radio } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import { format, isValid, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

function validDate(value) {
  const date = parseISO(value);
  return isValid(date) && format(date, "yyyy-MM-dd") === value;
}

const itemSchema = z.object({
  title: z.string().trim().min(1, "Enter a title").max(200),
  type: z.string().min(1, "Choose a type"),
  date: z.string().min(1, "Choose a date").refine(validDate, "Choose a valid date."),
  startTime: z.string().min(1, "Choose a start time").regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a valid start time."),
  endTime: z.string().optional().refine(
    (value) => !value || /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
    "Choose a valid end time."
  ),
  repeat: z.string()
    .min(1, "Choose how this item repeats")
    .refine((value) => ["none", "weekly", "monthly", "yearly"].includes(value), "Choose a valid repeat option"),
  endDate: z.string().optional().refine(
    (value) => !value || validDate(value),
    "Choose a valid end date."
  ),
  notes: z.string().max(5000).optional(),
}).superRefine((item, context) => {
  if (item.endTime && item.startTime && item.endTime <= item.startTime) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endTime"],
      message: "End time must be after the start time.",
    });
  }
  if (item.endDate && item.endDate < item.date) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDate"],
      message: "End date cannot be before the start date.",
    });
  }
});

function toInputDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

export default function ItemForm({ open, item, types, onCancel, onSave, onDelete, saving }) {
  const [editScope, setEditScope] = useState("series");
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      title: "",
      type: "",
      date: "",
      startTime: "",
      endTime: "",
      repeat: undefined,
      endDate: "",
      notes: "",
    },
  });
  const repeat = useWatch({ control, name: "repeat" });
  const isRecurringItem = Boolean(item?._id && item.repeat !== "none");
  const isOccurrenceEdit = isRecurringItem && editScope === "occurrence";

  useEffect(() => {
    setEditScope("series");
  }, [item, open]);

  useEffect(() => {
    const source = editScope === "series" ? item?.seriesItem || item : item;
    reset({
      title: source?.title || "",
      type: source ? String(source.type?._id || source.type) : "",
      date: toInputDate(
        isOccurrenceEdit ? item?.occurrenceDate || item?.date : source?.date
      ),
      startTime: source?.startTime || "",
      endTime: source?.endTime || "",
      repeat: source?.repeat || undefined,
      endDate: toInputDate(source?.endDate),
      notes: source?.notes || "",
    });
  }, [item, open, editScope, isOccurrenceEdit, reset]);

  function submit(values) {
    const payload = {
      ...values,
      endTime: values.endTime || undefined,
      endDate: isOccurrenceEdit || values.repeat === "none" ? undefined : values.endDate || undefined,
      notes: values.notes?.trim() || undefined,
    };
    if (isOccurrenceEdit) {
      delete payload.repeat;
    }
    onSave(payload, isOccurrenceEdit ? "occurrence" : "series");
  }

  return (
    <Modal
      title={item?._id ? "Edit item" : "Add an item"}
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
    >
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            key="item-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <form className="stack-form modal-form" onSubmit={handleSubmit(submit)} noValidate>
              {isRecurringItem && (
                <fieldset className="repeat-fieldset">
                  <legend>Apply changes to</legend>
                  <Radio.Group
                    value={editScope}
                    onChange={(event) => setEditScope(event.target.value)}
                    className="repeat-options"
                  >
                    <Radio value="occurrence">This occurrence only</Radio>
                    <Radio value="series">Entire series</Radio>
                  </Radio.Group>
                </fieldset>
              )}

              <label htmlFor="item-title">Title</label>
              <input id="item-title" className="native-input" placeholder="What are you planning?" {...register("title")} />
              {errors.title && <span className="field-error">{errors.title.message}</span>}

              <label htmlFor="item-type">Type</label>
              <select id="item-type" className="native-select" {...register("type")}>
                <option value="">Choose a type</option>
                {types.map((type) => <option value={type._id} key={type._id}>{type.name}</option>)}
              </select>
              {errors.type && <span className="field-error">{errors.type.message}</span>}

              <div className="field-row">
                <div>
                  <label htmlFor="item-date">Date</label>
                  <input id="item-date" type="date" className="native-input" {...register("date")} />
                  {errors.date && <span className="field-error">{errors.date.message}</span>}
                </div>
                <div>
                  <label htmlFor="item-start-time">Start time</label>
                  <input id="item-start-time" type="time" className="native-input" {...register("startTime")} />
                  {errors.startTime && <span className="field-error">{errors.startTime.message}</span>}
                </div>
              </div>

              <label htmlFor="item-end-time">End time <span className="optional-label">Optional</span></label>
              <input id="item-end-time" type="time" className="native-input" {...register("endTime")} />
              {errors.endTime && <span className="field-error">{errors.endTime.message}</span>}

              {isOccurrenceEdit ? (
                <p className="repeat-hint">The repeat schedule is unchanged for this occurrence.</p>
              ) : (
                <>
                  <fieldset className="repeat-fieldset">
                    <legend>Repeat</legend>
                    <Controller
                      control={control}
                      name="repeat"
                      render={({ field }) => (
                        <Radio.Group {...field} className="repeat-options">
                          <Radio value="none">This date only</Radio>
                          <Radio value="weekly">Every week</Radio>
                          <Radio value="monthly">Every month</Radio>
                          <Radio value="yearly">Every year</Radio>
                        </Radio.Group>
                      )}
                    />
                    {errors.repeat && <span className="field-error">{errors.repeat.message}</span>}
                  </fieldset>

                  {!repeat && <p className="repeat-hint">Choose a repeat option before saving.</p>}

                  {repeat && repeat !== "none" && (
                    <div>
                      <label htmlFor="item-end-date">Ends on <span className="optional-label">Optional</span></label>
                      <input id="item-end-date" type="date" className="native-input" {...register("endDate")} />
                      {errors.endDate && <span className="field-error">{errors.endDate.message}</span>}
                    </div>
                  )}
                </>
              )}

              <label htmlFor="item-notes">Notes <span className="optional-label">Optional</span></label>
              <textarea id="item-notes" className="native-textarea" rows={3} {...register("notes")} />
              {errors.notes && <span className="field-error">{errors.notes.message}</span>}

              <div className="form-actions">
                {item?._id && (
                  <Button
                    danger
                    className="delete-item-button"
                    onClick={() => onDelete(item, isOccurrenceEdit ? "occurrence" : "series")}
                  >
                    {isOccurrenceEdit ? "Delete occurrence" : isRecurringItem ? "Delete series" : "Delete"}
                  </Button>
                )}
                <Button onClick={onCancel}>Cancel</Button>
                <Button type="primary" htmlType="submit" disabled={!repeat} loading={saving}>
                  Save item
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
