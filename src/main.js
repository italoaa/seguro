const { configDir, desktopDir } = window.__TAURI__.path;
const { exists , BaseDirectory} = window.__TAURI__.fs;
const { invoke } = window.__TAURI__.tauri;
const { message } = window.__TAURI__.dialog;

window.addEventListener("DOMContentLoaded", async () => {
    // Show a loading screen
    await router();
})

// variable used to see in which step of 
// the welcome page you are
let counter = 1;

// VAriable used to create a vault with a name
let name = "";

// Variable to record the state
let state;


// On click to continue the page changes to the next set of items
document.getElementById("continue").addEventListener("click", async () => {
    if (counter == 4) {
	document.getElementById(counter.toString()).style.display = "none";
	document.getElementById("continue").style.display = "none";
	lock_page();
	return 0; // end of sequence
    }
    
    if (counter === 2) {
	// Save the name to create the valut
	name = document.getElementById("name").value;
	if (name == "") {
	    // Notify the name is empty
	    message('El nombre esta vacio', { title: 'Seguro', type: 'error' });
	    return 0;
	}
    } else if (counter === 3) {
	// Check both passwords match
	let first_pass = document.getElementById("first-password").value;
	let re_pass = document.getElementById("re-password").value;
	if (first_pass !== re_pass) {
	    message('Las contraseñas no coinciden', { title: 'Seguro', type: 'error' });
	    return 0;
	} else if (first_pass == "") {
	    message('Las contraseña esta vacia', { title: 'Seguro', type: 'error' });
	} else {
	    // Call create vault with the password and name
	    const result = await invoke("create_vault", {password: first_pass, vaultName: name});
	    if (result !== 0 ) {
		console.log("error code:" + result);
		return 0;
	    }
	}
    }
    
    // Update the 
    document.getElementById(counter.toString()).style.display = "none";
    counter++;
    document.getElementById(counter.toString()).style.display = "flex";
})

// Routes the app to the appropiate page
async function router() {
    // Check if it is the first time opening the app
    const exists_vault = await invoke("exists_vault", {});

    if (exists_vault === 0) { // 0 is for exists as there is no error reading init.txt
	// Show the welcome page
	lock_page();
    } else {
	// If 1 error reading because it does not exist. 
	// then show welcome
	welcome();
    }
}

// Shows the welcome procedure
function welcome() {
    document.getElementById("1").style.display = "inline";
    document.getElementById("continue").style.display = "inline";
}

// Shows the lock page
// And decides weather to show the 
// closed vault page or open vault page
async function lock_page() {
    // Paint the background
    start();
    state = await invoke("get_vault_state");

    setTimeout(function () {
	if (state === 0) {
	    // closed 
	    closed()
	} else if (state === 1) {
	    // opened
	    opened()
	}

	// add the listener for the button
	document.getElementById("switch").addEventListener("click", async () => {
	    // get state
	    // move the switch
	    state = await invoke("get_vault_state");

	    if (state === 0) { // closed
		// Clicked the switch to open the vault so move to open
		document.querySelector("body").style.filter = "blur(10px)"
		setTimeout(function () {
		    open_lock_page()
		    document.querySelector("body").style.filter = "blur(0px)"
		    document.getElementById("password").value = "";
		}, 500)
	    } else if (state === 1) { // opened
		// Clicked the switch to open the vault so move to closed
		document.querySelector("body").style.filter = "blur(10px)"
		setTimeout(function () {
		    close_lock_page()
		    document.querySelector("body").style.filter = "blur(0px)"
		    document.getElementById("password").value = "";
		}, 500)
	    }
	})
    }, 1000);
}

// Funciton to animate the initial state of the app
function start(){
    document.querySelector("body").style.background = "var(--main-bg)";
    document.querySelector("#lock circle").style.fill = "var(--main-bg-grey)";
    document.querySelector("#lock circle").style.strokeDashoffset = "0";
    document.querySelector("#switch rect").style.strokeDashoffset = "0";
    document.querySelector("#switch rect").style.fill = "var(--main-bg-grey)";
    document.getElementById("lock").style.display = "inline";
    document.getElementById("password").style.display = "inline";
    document.getElementById("switch").style.display = "inline";
}

// Function to set the closed variables for the elements
function closed() {
    document.querySelector("body").style.background = "var(--main-bg-red)";
    document.querySelector("#lock circle").style.fill = "var(--main-red)";
    document.querySelector("#switch rect").style.fill = "var(--main-red)";
}

// Function to set the open variables for the elements
function opened() {
    document.querySelector("body").style.background = "var(--main-bg-green)";
    document.querySelector("#lock circle").style.fill = "var(--main-green)";
    document.querySelector("#switch rect").style.fill = "var(--main-green)";
    document.querySelector("#lock #topsemi").style.transform = "translateY(-15px) translateX(-15px) rotateZ(45deg)";
}

// THis function is called when the vault is opened and the user
// Wants to close his vault
async function close_lock_page() {
    console.log("closing")
    const result = await rust_close();
    console.log(result);
    if (result === 0) {
	document.querySelector("#switch rect").style.fill = "var(--main-red)";
	document.querySelector("#switch circle").style.transform = "translateX(120px)";
	document.querySelector("#lock #topsemi").style.transform = "rotateZ(0deg)";
	closed();
    } else {
	// Error
	return 1;
    }
}

// THis function is called when the vault is closed and the user
// Wants to open his vault
async function open_lock_page() {
    console.log("opening");
    const result = await rust_open();
    if (result === 0) {
	// Success so change the page color
	document.querySelector("#switch rect").style.fill = "var(--main-green)";
	document.querySelector("#switch circle").style.transform = "translateX(0px)";
	opened();
    } else {
	// Error so do nothing
	return 1;
    }
}

// This function checks for empty passwords
function check_empty_password() {
    let passwordInput = document.getElementById("password")
    if (passwordInput.value == "") {
	message('La contraseña esta vacia', { title: 'Seguro', type: 'error' });
	return 1; // Error they are the same
    } else {
	return 0; // Success
    }
}

// THis function manages the calling the rust api
// And also the return values 
// And the notification of errors
async function rust_close() {
    let passwordInput = document.getElementById("password")
    if (check_empty_password === 1) {
	return 1; // they are the same
    }
    const result = await invoke("close_vault", {password: passwordInput.value});
    // 0 Success
    // 1 incorrect
    if (result === 0) {
	return 0; // Success
    } else if (result === 1) {
	// Notify incorrect password
	message('La contraseña es incorrecta', { title: 'Seguro', type: 'error' });
	return 1; // Error
    } 
}

// THis function manages the calling the rust api
// And also the return values 
// And the notification of errors
async function rust_open() {
    let passwordInput = document.getElementById("password")
    if (check_empty_password === 1) {
	return 1; // they are the same
    }
    const result = await invoke("open_vault", {password: passwordInput.value});
    // 0 Success
    // 1 incorrect
    // 2 error in decryption
    if (result === 0) {
	return 0; // Success
    } else if (result === 1) {
	// Notify incorrect password
	message('La contraseña es incorrecta', { title: 'Seguro', type: 'error' });
	return 1; // Error
    } else {
	// The rest are decryption errors
	// Just notify something went wrong
	message('Algo salió mal', { title: 'Seguro', type: 'error' });
	return 1; // Error
    }
}

