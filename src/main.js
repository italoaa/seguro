const { desktopDir } = window.__TAURI__.path;


window.addEventListener("DOMContentLoaded", async () => {
  // Get the Desktop path
  const desktopPath = await getDesktopDir();
  document.querySelector("#cerrar").addEventListener("click"), (e) => {
    // TODO: add logic to check that filename is not empty
  }
});

async function getDesktopDir() {
  const desktopPath = await desktopDir();
  document.querySelector("#greet-form").addEventListener("submit", (e) => {
}


// let greetInputEl;
// let greetMsgEl;

// async function greet() {
//   // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
//   greetMsgEl.textContent = await invoke("greet", { name: greetInputEl.value });
// }

// window.addEventListener("DOMContentLoaded", () => {
//   greetInputEl = document.querySelector("#greet-input");
//   greetMsgEl = document.querySelector("#greet-msg");
//   document.querySelector("#greet-form").addEventListener("submit", (e) => {
//     e.preventDefault();
//     greet();
//   });
// });
