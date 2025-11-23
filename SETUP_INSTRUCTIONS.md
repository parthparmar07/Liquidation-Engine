# 🛠️ Setup Instructions for Windows
It looks like you are missing the necessary tools to run the Liquidation Engine. Please follow these steps to set up your environment.

## 1. Install Rust
Rust is the programming language used for both the backend and the Solana smart contract.

1.  Go to [https://rustup.rs/](https://rustup.rs/).
2.  Download `rustup-init.exe`.
3.  **CRITICAL FIX FOR "LINKER ERROR"**:
    *   The error you are seeing (`ensure that Visual Studio 2017 or later...`) means you are missing the C++ tools.
    *   **Download Build Tools**: [Click here to download Visual Studio Build Tools 2022](https://aka.ms/vs/17/release/vs_buildtools.exe).
    *   Run the installer.
    *   **IMPORTANT**: In the "Workloads" tab, you **MUST** check the box that says **"Desktop development with C++"**.
    *   Click "Install" (it will download ~2-6 GB).
    *   **Restart your computer** after this installation to ensure the path is updated.
4.  Once the build tools are installed, open a NEW terminal and try the `cargo install` command again.
5.  **Important**: After installation, close and reopen your terminal (PowerShell/Command Prompt) to refresh your PATH.

## 2. Install Solana Tool Suite
You need the Solana CLI to interact with the blockchain and build the program.

1.  Open a PowerShell terminal as **Administrator**.
2.  Run the following command:
    ```powershell
    # 1. Force PowerShell to use TLS 1.2 (Fixes connection errors)
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

    # 2. Download the installer
    Invoke-WebRequest -Uri "https://release.solana.com/v1.18.18/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile "C:\solana-install-init.exe"
    
    # 3. Run the installer
    C:\solana-install-init.exe v1.18.18
    ```
    > **Alternative**: If the command above still fails, you can manually download the installer from [this link](https://release.solana.com/v1.18.18/solana-install-init-x86_64-pc-windows-msvc.exe), save it to `C:\`, and then run the last command.
3.  After installation, close and reopen your terminal.


## 3. Install Anchor
Anchor is the framework used for the Solana smart contract.
1.  You need to install `avm` (Anchor Version Manager) using Cargo (which you installed in Step 1).
    ```powershell
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    ```
2.  Install the latest version of Anchor:
    ```powershell
    avm install latest
    avm use latest
    ```
## 4. Verify Installation
Run the following commands to ensure everything is set up correctly:
```powershell
rustc --version
solana --version
anchor --version
```
If all these commands return version numbers, you are ready to proceed!

## 5. Run the Project
**Backend:**
```powershell
cd backend
cargo run
```

**Smart Contract:**
```powershell
cd anchor
anchor build
anchor test 
```
