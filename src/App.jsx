import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";
import ToastContainer from "./components/Notifications/ToastContainer";
import AtlasCommand from "./AtlasCommand";

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AtlasCommand />
        <ToastContainer />
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
