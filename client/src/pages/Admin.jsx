import { useEffect, useState } from "react";
import { Button, Popconfirm, Spin, Table, Typography } from "antd";
import { Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { usersApi } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

const { Title, Text } = Typography;

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    try {
      const { data } = await usersApi.list();
      setUsers(data.users);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function deleteUser(id) {
    try {
      await usersApi.remove(id);
      toast.success("User deleted");
      await loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete this user.");
    }
  }

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Role", dataIndex: "role", key: "role" },
    {
      title: "Joined",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) => value ? format(parseISO(value), "MMM d, yyyy") : "—",
    },
    {
      title: "",
      key: "action",
      render: (_, record) => (
        <Popconfirm
          title={`Delete ${record.name}?`}
          description="Their account will be removed."
          okText="Delete"
          cancelText="Keep"
          onConfirm={() => deleteUser(record._id)}
          disabled={record._id === user?.id}
        >
          <Button
            danger
            type="text"
            disabled={record._id === user?.id}
            icon={<Trash2 size={16} />}
            aria-label={`Delete ${record.name}`}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <Title level={2}>User accounts</Title>
          <Text className="muted-copy">Manage accounts for this planner.</Text>
        </div>
      </div>
      {loading ? (
        <div className="page-loading"><Spin size="large" /></div>
      ) : (
        <Table
          className="admin-table"
          rowKey="_id"
          columns={columns}
          dataSource={users}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 600 }}
        />
      )}
    </section>
  );
}
