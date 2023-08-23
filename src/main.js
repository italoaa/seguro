const { desktopDir } = window.__TAURI__.path;
const { exists , BaseDirectory} = window.__TAURI__.fs;
const { invoke } = window.__TAURI__.tauri;
const { message } = window.__TAURI__.dialog;


// Main application logic
window.addEventListener("DOMContentLoaded", async () => {
  // Is the valut Present
  const vaultPath = await isValutPresent();

  // check if the valut exists
  if (vaultPath) {
    // The Valut exists!
    operations();
  } else {
    // it does not exist
    creation();
  }

  let passwordInput;

  // event listeners for clicks on buttons
  document.querySelector('#crear').addEventListener("click", async () => {
    const result = await invoke("createVault");
    // Reload the app
    if (result === 0) { // 0 is success
      // Success
      location.reload()
    } else { // Something else but 0 so error
      // handle and notify
      if (result === 1) { // Could not create the folder

        message("No se pudo crear la caja fuerte", {title: 'Error', type: "error"});
        location.reload()

      } else if (result === 2) { // Could not get the desktop path

        message("No se pudo conseguir camino al escritorio", {title: 'Error', type: "error"});
        location.reload()

      }
    }
  })

  document.querySelector('#abrir').addEventListener("click", async () => {
    passwordInput = document.querySelector('#password');
    if (passwordInput.value === "") {
      // alert empty password
      message("Contraseña Vacía", {title: 'Error', type: "error"});
    } else {
      const result = await invoke("open_vault", { password : passwordInput.value});
      console.log("abrir " + result);
    }
  })

  document.querySelector('#cerrar').addEventListener("click", async () => {
    passwordInput = document.querySelector('#password');
    if (passwordInput.value === "") {
      // alert empty password
      message("Contraseña Vacía", {title: 'Error', type: "error"});
    } else {
      const result = await invoke("close_vault", { password : passwordInput.value});
      console.log(result);
    }
  })
});

async function isValutPresent() {
  // Get the path to the Desktop
  const desktopPath = await desktopDir();

  // Check if an opened or closed vault exist
  const decrypted_vault = await exists('CajaFuerte', {dir : BaseDirectory.Desktop} )
  const encrypted_vault = await exists('CajaFuerte.encrypted', {dir : BaseDirectory.Desktop} )

  return decrypted_vault || encrypted_vault
}

function operations() {
  // Display elements with operations class
  console.log("display operations!");
  document.querySelectorAll('.operations').forEach(el => {
    el.classList.remove("hide");
  });
}

function creation() {
  // Display elements with creation class
  console.log("display creations!");
  document.querySelectorAll('.creations').forEach(el => {
    el.classList.remove("hide");
    console.log(el);
  });

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
