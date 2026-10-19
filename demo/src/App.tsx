import { Title } from "@solidjs/meta";
import Logo from "./logo.svg?solid";
import HeroIcon from "heroicons/16/solid/academic-cap.svg?solid"
import "./App.css";

export default function App() {
  return (
    <>
      <Title>Solid App</Title>
      <Logo />
      <HeroIcon />
    </>
  );
}
