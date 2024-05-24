const { platform } = require("node:process");

const { exec } = require("node:child_process");
const { promisify } = require("node:util");
var _exec = promisify(exec);
const Registry = require("winreg");

class HWID
{
    darwinHWID()
    {
        return new Promise(async (resolve) => {
            const { stdout } = await _exec("ioreg -rd1 -c IOPlatformExpertDevice");
            const uuid = stdout.trim().split("\n").find((line) => line.includes("IOPlatformUUID"))?.replaceAll(/=|\s+|"/gi, "").replaceAll("IOPlatformUUID", "");
            if (!uuid)
                console.log("failed to find hwid");
            resolve(uuid);
        });
    }
  
    linuxHWID() 
    {
        return new Promise(async (resolve) => {
            const { stdout } = await _exec(
            "cat /var/lib/dbus/machine-id /etc/machine-id 2> /dev/null || true"
            );
            const array = stdout.trim().split("\n");
            const first = array[0];
            if (!first)
                console.log("failed to find hwid");
            resolve(first);
        });
    }

    win32HWID()
    {
        return new Promise(async (resolve) => {
            const regKey = new Registry({
              hive: Registry.HKLM,
              key: "\\SOFTWARE\\Microsoft\\Cryptography"
            });
            const getKey = promisify(regKey.get.bind(regKey));
            const key = await getKey("MachineGuid");
            resolve(key.value.toLowerCase());
          });
    }
  
    resolveID()
    {
        return new Promise(async (resolve) => {
            switch (platform) {
              case "win32":
                resolve(this.win32HWID());
                break;
              case "darwin":
                resolve(this.darwinHWID());
                break;
              case "linux":
                resolve(this.linuxHWID());
                break;
              default:
                console.log("unsupported platform");
            }
          });
    }
    
  
    getHWID()
    {
        return new Promise(async (resolve) => {
            const hwid = await this.resolveID();
            if (hwid === "")
                console.log("failed to find hwid");
            resolve(hwid);
        });
    }
    
}

module.exports = HWID;