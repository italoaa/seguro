// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod vault;
use vault::{close_vault, create_vault, exists_vault, get_vault_state, open_vault};

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            create_vault,
            open_vault,
            close_vault,
            exists_vault,
            get_vault_state
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
