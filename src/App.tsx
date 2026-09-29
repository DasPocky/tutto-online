import { Toaster } from "@/components/ui/sonner";
import { useRoute } from "@/hooks/useRoute";
import { Home } from "@/pages/Home";
import { LocalGame } from "@/pages/LocalGame";
import { OnlineRoom } from "@/pages/OnlineRoom";

export default function App() {
  const route = useRoute();
  return (
    <>
      {route.name === "home" && <Home />}
      {route.name === "local" && <LocalGame />}
      {route.name === "room" && <OnlineRoom key={route.code} code={route.code} />}
      <Toaster />
    </>
  );
}
