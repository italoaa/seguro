const { desktopDir } = window.__TAURI__.path;
const { exists , BaseDirectory} = window.__TAURI__.fs;
const { invoke } = window.__TAURI__.tauri;
const { message } = window.__TAURI__.dialog;

let state; // 0 closed, 1 oppened

async function update_state() {
    // Is the valut Present
    const vaultPath = await isValutPresent();

    // check if the valut exists
    console.log("vault path: " + vaultPath);
    if (vaultPath) {
	// The Valut exists!
	operations();
    } else {
	// it does not exist
	creation();
    }

    // handle this disable button
    console.log("state is: " + state);
    if (state === 0) {
	// The vault is open disable 
	document.querySelector('#abrir').classList.add("hide");
	document.querySelector('#cerrar').classList.remove("hide");
    } else if (state === 1){
	// The vault is close disable 
	document.querySelector('#cerrar').classList.add("hide");
	document.querySelector('#abrir').classList.remove("hide");
    }
}

async function show_notice(message) {
    document.querySelector("#notice h2").innerHTML = message;
    document.querySelector("#notice").classList.add("ani_notice");
    document.querySelector("#Content").classList.add("ani_blur");
    setTimeout(async function () {
	await update_state();
	setTimeout(async function () {
	    document.querySelector("#notice").classList.remove("ani_notice");
	    document.querySelector("#Content").classList.remove("ani_blur");
	}, 3000);
    }, 3000);
}

// Main application logic
window.addEventListener("DOMContentLoaded", async () => {
    
    let passwordInput;

    await update_state();
    
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
		await show_notice("Caja Fuerte CREADA")
		passwordInput = document.querySelector('#password');
		passwordInput.value = "";
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
	    } else if (result === 2) {
		message("Error Abriendo", {title: 'Error', type: "error"});
	    } else {
		await show_notice("Caja Fuerte ABIERTA")
		passwordInput = document.querySelector('#password');
		passwordInput.value = "";
	    }
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
	    if (result === 1) {
		// The password is incorrect
		message("Contraseña Incorrecta", {title: 'Error', type: "error"});
	    } else {
		await show_notice("Caja Fuerte CERRADA")
		passwordInput = document.querySelector('#password');
		passwordInput.value = "";
	    }
	    
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
    } else {
	// Vault is not created
	state = 2; 
    }

    return decrypted_vault || encrypted_vault
}

function operations() {
    // Display elements with operations class
    console.log("display operations!");
    document.querySelectorAll('.operations').forEach(el => {
	el.classList.remove("hide");
    });
    document.querySelectorAll('.creations').forEach(el => {
	el.classList.add("hide");
	console.log(el);
    });
}

function creation() {
    // Display elements with creation class
    console.log("display creations!");
    document.querySelectorAll('.creations').forEach(el => {
	el.classList.remove("hide");
	console.log(el);
    });
    document.querySelectorAll('.operations').forEach(el => {
	el.classList.add("hide");
    });

}
