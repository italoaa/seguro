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

document.getElementById("switch").addEventListener("click", async () => {
    // Get the state of the vault
    // Opened or closed vault
    if (state === 0) {
	// Closed
    } else if (state === 1) {
	// Open
    }
})

// On click to continue the page changes to the next set of items
document.getElementById("continue").addEventListener("click", async () => {
    if (counter == 4) {
	// TODO goto lock page
	document.getElementById(counter.toString()).style.display = "none";
	document.getElementById("continue").style.display = "none";
	lock_page();
	return 0; // end of sequence
    }
    
    if (counter === 2) {
	// Save the name to create the valut
	name = document.getElementById("name").value;
	if (name == "") {
	    // TODO Notify the name is empty
	    console.log("empty"); // TODO notify
	    return 0;
	}
    } else if (counter === 3) {
	// Check both passwords match
	let first_pass = document.getElementById("first-password").value;
	let re_pass = document.getElementById("re-password").value;
	if (first_pass !== re_pass) {
	    console.log("does not match"); // TODO notify
	    return 0;
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
    document.getElementById(counter.toString()).style.display = "inline";
})

// Routes the app to the appropiate page
async function router() {
    // Check if it is the first time opening the app
    const exists_vault = await invoke("exists_vault", {});

    if (exists_vault === 0) { // 0 is for exists as there is no error reading init.txt
	// Show the welcome page
	// Check if it is open or closed
	// Show the respective page
	console.log("other pages")
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

async function lock_page() {
    // Paint the background
    start();
    state = await invoke("get_vault_state");

    setTimeout(function () {
	console.log("exec")
	if (state === 0) {
	    // closed 
	    closed()
	} else if (state === 1) {
	    // opened
	    opened()
	}
    },1000);
}

function start(){
    document.querySelector("body").style.background = "var(--main-bg)";
    document.querySelector("#lock circle").style.fill = "var(--main-bg-grey)";
    document.querySelector("#switch rect").style.fill = "var(--main-bg-grey)";
}

function closed() {
    document.querySelector("body").style.background = "var(--main-bg-red)";
    document.querySelector("#lock circle").style.fill = "var(--main-red)";
    document.querySelector("#switch rect").style.fill = "var(--main-red)";
}

function close_lcok() {
    document.querySelector("#lock #topsemi").style.transform = "translateY(15px) translateX(15px) rotateZ(-45deg)";
}

function move_switch() {
   // TODO code to move the switch 
}

function opened() {
    document.querySelector("body").style.background = "var(--main-bg-green)";
    document.querySelector("#lock circle").style.fill = "var(--main-green)";
    document.querySelector("#switch rect").style.fill = "var(--main-green)";
    document.querySelector("#lock #topsemi").style.transform = "translateY(-15px) translateX(-15px) rotateZ(45deg)";
}
