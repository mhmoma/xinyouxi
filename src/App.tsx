import React from "react";

export default function App() {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black flex items-center justify-center p-0 m-0">
      <iframe
        src="/game.html"
        className="w-full h-full border-0 block"
        title="合租的她"
        allow="autoplay; fullscreen"
      />
    </div>
  );
}
