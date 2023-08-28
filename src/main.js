const { desktopDir } = window.__TAURI__.path;
const { exists , BaseDirectory} = window.__TAURI__.fs;
const { invoke } = window.__TAURI__.tauri;
const { message } = window.__TAURI__.dialog;

let state; // 0 closed, 1 oppened

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
    
    // TODO: handle this disable button
    if (state === 0) {
	// The vault is open disable 
	document.querySelector('#abrir').style.opacity = "40%";
	document.querySelector('#abrir').classList.remove("hovereable")
    } else {
	// The vault is close disable 
	document.querySelector('#cerrar').style.opacity = "40%";
	document.querySelector('#cerrar').classList.remove("hovereable")
    }

    // event listeners for clicks on buttons
    document.querySelector('#crear').addEventListener("click", async () => {
	passwordInput = document.querySelector('#password');
	if (passwordInput.value === "") {
	    // alert empty password
	    message("Contraseña Vacía", {title: 'Error', type: "error"});
	} else {
	    const result = await invoke("create_vault", {password: passwordInput.value});
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
	}
    })

    document.querySelector('#abrir').addEventListener("click", async () => {
	console.log(state)
	if (state === 0) {return 0;} // if it is 0 then it is closed and can be opened
	passwordInput = document.querySelector('#password');
	if (passwordInput.value === "") {
	    // alert empty password
	    message("Contraseña Vacía", {title: 'Error', type: "error"});
	} else {
	    const result = await invoke("open_vault", { password : passwordInput.value});
	    if (result === 1) {
		// The password is incorrect
		message("Contraseña Incorrecta", {title: 'Error', type: "error"});
	    }
	    passwordInput.value = "";
	    location.reload()
	}
    })

    document.querySelector('#cerrar').addEventListener("click", async () => {
	console.log(state)
	if (state === 1) {return 0;} // if it is 1 it is opened and can be close
	passwordInput = document.querySelector('#password');
	if (passwordInput.value === "") {
	    // alert empty password
	    message("Contraseña Vacía", {title: 'Error', type: "error"});
	} else {
	    const result = await invoke("close_vault", { password : passwordInput.value});
	    passwordInput.value = "";
	    location.reload()
	}
    })
});

async function isValutPresent() {
    // Get the path to the Desktop
    const desktopPath = await desktopDir();

    // Check if an opened or closed vault exist
    const decrypted_vault = await exists('CajaFuerte', {dir : BaseDirectory.Desktop} )
    const encrypted_vault = await exists('CajaFuerte.encrypted', {dir : BaseDirectory.Desktop} )
    
    if (decrypted_vault) {
	// the vault is opened
	state = 0;
    } else if (encrypted_vault){
	// the vault is closed
	state = 1;
    }

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
