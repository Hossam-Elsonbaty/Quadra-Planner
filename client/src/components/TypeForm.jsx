import { Button, Modal } from "antd";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

export default function TypeForm({ open, type, onCancel, onSave, saving }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    reset({ name: type?.name || "", color: type?.color || "#6F8B77" });
  }, [type, open, reset]);

  return (
    <Modal
      title={type ? "Edit type" : "New type"}
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
    >
      <form className="stack-form modal-form" onSubmit={handleSubmit(onSave)} noValidate>
        <label htmlFor="type-name">Name</label>
        <input
          id="type-name"
          className="native-input"
          placeholder="For example, Class"
          {...register("name", { required: "Enter a name", maxLength: 100 })}
        />
        {errors.name && <span className="field-error">Enter a name of 100 characters or fewer.</span>}
        <label htmlFor="type-color">Color</label>
        <div className="color-control">
          <input
            id="type-color"
            className="color-input"
            type="color"
            aria-label="Type color"
            {...register("color", { required: true })}
          />
          <span className="muted-copy">Choose one flat color for this type.</span>
        </div>
        <div className="form-actions">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            Save type
          </Button>
        </div>
      </form>
    </Modal>
  );
}
