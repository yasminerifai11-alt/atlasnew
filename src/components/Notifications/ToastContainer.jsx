import { useNotifications } from "../../context/NotificationContext";
import Toast from "./Toast";

export default function ToastContainer() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div style={{
      position: "fixed", top: 60, right: 16, zIndex: 9999,
      display: "flex", flexDirection: "column", gap: 8,
      pointerEvents: notifications.length ? "auto" : "none",
    }}>
      {notifications.map(n => (
        <Toast key={n.id} notification={n} onDismiss={removeNotification} />
      ))}
    </div>
  );
}
