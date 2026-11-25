import { useEffect, useState } from "react";
import { Button, Card, Empty, Popconfirm, Spin, Typography } from "antd";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { typesApi } from "../api.js";
import TypeForm from "../components/TypeForm.jsx";

const { Title, Text } = Typography;

export default function Types() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);

  async function loadTypes() {
    try {
      const { data } = await typesApi.list();
      setTypes(data.types);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load item types.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTypes();
  }, []);

  function openForm(type = null) {
    setEditingType(type);
    setFormOpen(true);
  }

  async function saveType(values) {
    setSaving(true);
    try {
      if (editingType) await typesApi.update(editingType._id, values);
      else await typesApi.create(values);
      toast.success(editingType ? "Type updated" : "Type created");
      setFormOpen(false);
      await loadTypes();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save this type.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteType(id) {
    try {
      await typesApi.remove(id);
      toast.success("Type deleted");
      await loadTypes();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete this type.");
    }
  }

  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <Title level={2}>Your types</Title>
          <Text className="muted-copy">Give each kind of plan a name and a color.</Text>
        </div>
        <Button type="primary" icon={<Plus size={17} />} onClick={() => openForm()}>
          New type
        </Button>
      </div>
      {loading ? (
        <div className="page-loading"><Spin size="large" /></div>
      ) : types.length === 0 ? (
        <Card className="empty-card"><Empty description="No types yet. Create one to start organizing your items." /></Card>
      ) : (
        <div className="type-grid">
          {types.map((type) => (
            <Card className="type-card" key={type._id}>
              <span className="type-swatch" style={{ backgroundColor: type.color }} />
              <span className="type-name">{type.name}</span>
              <div className="type-actions">
                <Button
                  type="text"
                  aria-label={`Edit ${type.name}`}
                  icon={<Edit2 size={16} />}
                  onClick={() => openForm(type)}
                />
                <Popconfirm
                  title={`Delete ${type.name}?`}
                  description="A type cannot be deleted while items use it."
                  okText="Delete"
                  cancelText="Keep"
                  onConfirm={() => deleteType(type._id)}
                >
                  <Button type="text" danger aria-label={`Delete ${type.name}`} icon={<Trash2 size={16} />} />
                </Popconfirm>
              </div>
            </Card>
          ))}
        </div>
      )}
      <TypeForm
        open={formOpen}
        type={editingType}
        saving={saving}
        onCancel={() => setFormOpen(false)}
        onSave={saveType}
      />
    </section>
  );
}
