type W = Record<string, { title: string; body: string[] }[]>;

export const walk: W = {
  "mac-lab": [
    { title: "What a sysadmin actually does", body: [
      "A system administrator keeps servers running, secure and recoverable: installing software, managing users, watching logs, applying updates and restoring from backups when things break. Most servers in the world run Linux; most offices manage their PCs with Windows Server Active Directory. You'll practice both."] },
    { title: "Virtual machines on your Mac", body: [
      "A **VM** is a full computer simulated inside yours, with its own OS, users and network. Break it, delete it, make a new one in a minute. Apple Silicon is ARM, so it runs ARM Linux natively and fast (OrbStack, Multipass, UTM).",
      "Windows Server has no ARM version, so for AD/DNS/DHCP labs use an x64 cloud VM (Azure for Students) or the school lab. **Containers** (Docker) are lighter than VMs but share the host's kernel and usually lack systemd, which makes them great for running apps but poor for practicing system administration."] },
  ],
  filesystem: [
    { title: "One tree, starting at /", body: [
      "Linux has no C: or D: drives. Everything hangs off one root `/`, and disks are *mounted* into folders. The layout is standardized (FHS), so once you learn it every Linux server feels familiar: `/etc` holds configuration, `/var/log` logs, `/home` users' files, `/usr/bin` programs, `/tmp` temporary files, `/var/www` websites."] },
    { title: "Moving around efficiently", body: [
      "`pwd` (where am I), `ls -la` (list including hidden files and permissions), `cd` (move; `cd -` jumps back). Find files by name with `find /etc -name '*.conf'`; find text inside files with `grep -rn 'text' /path`. `less` reads big files, and `tail -f` follows a log live as it grows.",
      "When unsure about a command, `man command` shows its manual, and `command --help` gives a quick summary."] },
    { title: "macOS is Unix, but different", body: [
      "Your Mac's Terminal runs most of the same commands, but macOS uses BSD versions with different flags (`sed -i ''`, `stat -f`) and its own service manager (launchd). That's why we practice inside a Linux VM: the server you'll manage at work behaves like the VM, not like your Mac."] },
  ],
  permissions: [
    { title: "Who can do what", body: [
      "Every file has an **owner**, a **group**, and permission bits for three audiences: the owner, members of the group, and everyone else. Each audience can have **r** (read), **w** (write) and **x** (execute; for folders, x means \"can enter\"). `ls -l` shows them as `-rwxr-xr-x`."] },
    { title: "Numbers: 755, 644, 600", body: [
      "Each permission has a value: r = 4, w = 2, x = 1. Add them per audience: rwx = 7, r-x = 5, r-- = 4. So **755** means the owner can do everything and others can read and enter (scripts, folders). **644** means the owner reads and writes and others read (normal files). **600** means owner only (SSH keys, secrets).",
      "`chmod 640 file` sets them; `chown user:group file` changes the owner. The fix for \"permission denied\" is almost always correct **ownership**, never `chmod 777` (everyone can write = a security hole)."] },
    { title: "Special bits", body: [
      "**setgid** on a folder (the 2 in 2775) makes new files inherit the folder's group, which is perfect for shared team folders. The **sticky bit** (like `/tmp`) lets everyone create files but only delete their own."] },
  ],
  users: [
    { title: "Accounts are the first security layer", body: [
      "Every person gets their **own account**. Shared logins make it impossible to know who did what or to remove one person's access. User info lives in `/etc/passwd`, password hashes in `/etc/shadow`, groups in `/etc/group`."] },
    { title: "Groups give permissions", body: [
      "Instead of granting permissions person by person, add people to groups. Admin rights on Ubuntu come from the `sudo` group (`wheel` on RHEL). `sudo` runs a single command as root and logs it, which is much safer than logging in as root.",
      "`usermod -aG group user` adds a group. Without `-a` you **replace** all their groups, a classic mistake. Group changes apply at the next login."] },
    { title: "Offboarding", body: [
      "When someone leaves, lock or delete their account immediately (`usermod -L`, `deluser`), and remove their SSH keys. Review the sudo group regularly: forgotten admin accounts are a common way in."] },
  ],
  "processes-services": [
    { title: "Processes", body: [
      "Every running program is a **process** with an ID (PID). `ps aux` lists them, `htop` shows them live, and `pgrep -a nginx` finds one by name. `kill PID` asks it to stop cleanly (signal 15); `kill -9` forces it, which skips cleanup and can corrupt data, so use it only as a last resort."] },
    { title: "Services and systemd", body: [
      "A **service** is a background process that should always run (nginx, ssh, databases). **systemd** starts, stops, restarts and supervises them. `systemctl status nginx` shows whether it's running, recent logs and why it failed.",
      "Two separate ideas: **start** runs it now; **enable** starts it automatically at every boot. Production services need both (`systemctl enable --now`). After editing a unit file, run `systemctl daemon-reload`."] },
    { title: "Reading a failure", body: [
      "When a service won't start, `systemctl status` usually shows the last error lines. For more, `journalctl -u nginx -n 50`. Many apps also test their own config first, like `nginx -t`, which points to the exact broken line."] },
  ],
  packages: [
    { title: "Package managers", body: [
      "Instead of downloading installers, Linux installs software from trusted repositories with a package manager: **apt** on Ubuntu/Debian, **dnf** on RHEL/Fedora. It handles dependencies, updates and removal. On your Mac the equivalent is Homebrew; on Windows, winget."] },
    { title: "update vs upgrade", body: [
      "`apt update` refreshes the **list** of available packages; it installs nothing. `apt upgrade` actually installs newer versions. On a fresh server always run update first, or installs fail with \"unable to locate package\"."] },
    { title: "Patching is security", body: [
      "Most break-ins exploit known bugs that already have fixes. Turn on `unattended-upgrades` so security patches install automatically, and schedule regular full upgrades with a reboot window."] },
  ],
  networking: [
    { title: "The questions you'll ask every day", body: [
      "*What's my IP?* `ip a`. *Where does traffic go?* `ip route` (the default gateway). *Is the name resolving?* `dig example.com +short`. *Can I reach it?* `ping`, then `nc -zv host port` to test a specific port. *What's listening here?* `ss -tulpn`, which shows each listening port and the program behind it."] },
    { title: "Listening addresses matter", body: [
      "A service bound to `127.0.0.1` accepts connections only from the same machine; `0.0.0.0` accepts from anywhere. \"Works on the server but not from my laptop\" is usually this, or the firewall."] },
    { title: "SSH and keys", body: [
      "SSH gives you an encrypted remote terminal. Instead of passwords, use a **key pair**: the private key stays on your Mac, and the public key goes into the server's `~/.ssh/authorized_keys`. Keys can't be guessed by bots the way passwords can.",
      "Once keys work, disable password login and root login in `/etc/ssh/sshd_config`, and always test from a second terminal before closing the first."] },
  ],
  "firewall-security": [
    { title: "Close every door you don't use", body: [
      "A firewall decides which incoming connections are allowed. On a web server you typically allow only SSH (22) and HTTP/HTTPS (80/443) and block everything else, including the database port, which should never face the internet. On Ubuntu, **ufw** makes this a few commands."] },
    { title: "Order matters", body: [
      "Enabling ufw blocks everything not explicitly allowed, including your current SSH session. So `ufw allow OpenSSH` comes **before** `ufw enable`. Check the result with `ufw status verbose`."] },
    { title: "Hardening checklist", body: [
      "A personal sudo user, key-only SSH, no root login, the firewall on, **fail2ban** (bans IPs after repeated failed logins), automatic security updates, and no unnecessary services listening. Compare `ss -tulpn` before and after: every open port should have a reason."] },
  ],
  "logs-monitoring": [
    { title: "Logs: the server's diary", body: [
      "When something breaks, logs tell you what happened. systemd collects logs in the **journal**: `journalctl -u ssh` for one service, `-f` to follow live, `-p err -b` for errors since boot. Many apps also write files under `/var/log` (nginx's `error.log`, `auth.log` for logins)."] },
    { title: "Monitoring: know before users tell you", body: [
      "Check the vital signs: `df -h` (disk; a full disk breaks everything), `df -i` (inodes, which can run out even with free space), `free -h` (memory), `uptime` (load average). Tools like Uptime Kuma, Netdata or Prometheus + Grafana check these automatically and alert you."] },
    { title: "A troubleshooting habit", body: [
      "Symptom → `systemctl status` → `ss -tulpn` (is it listening?) → logs → fix → verify. Following the same order every time beats guessing."] },
  ],
  "scripting-cron": [
    { title: "Scripts: turn steps into one command", body: [
      "A bash script is just commands in a file, starting with `#!/usr/bin/env bash`. Add `set -euo pipefail` so the script stops at the first error instead of carrying on and doing damage. Variables: `NAME=value`, used as `\"$NAME\"`. Always quote variables, or spaces in filenames break things.",
      "Arguments arrive as `$1`, `$2`; `$?` is the last command's exit code (0 = success). `chmod +x script.sh` makes it runnable."] },
    { title: "cron: run it on a schedule", body: [
      "`crontab -e` opens your schedule. Each line has 5 time fields (minute, hour, day of month, month, day of week) and a command. `0 2 * * *` = daily at 02:00; `*/5 * * * *` = every 5 minutes. crontab.guru translates them.",
      "cron runs with a minimal environment, so use **absolute paths** everywhere and redirect output to a log (`>> file.log 2>&1`). Most \"cron doesn't work\" problems are those two things."] },
  ],
  backups: [
    { title: "The 3-2-1 rule", body: [
      "Keep **3** copies of important data, on **2** different kinds of storage, with **1** copy offsite. A backup on the same disk dies with the disk; a backup in the same building can burn with it."] },
    { title: "Tools", body: [
      "`tar -czf` packs folders into one compressed archive. `rsync -avh` copies only what changed, locally or over SSH; a trailing slash on the source means \"its contents\". For databases, use `pg_dump` / `mysqldump` instead of copying the live data files."] },
    { title: "Restore or it didn't happen", body: [
      "Scripts fail silently: wrong password, full disk, empty files. Check that backup files are bigger than 0 bytes, alert on failure, and regularly restore into a test location. Decide how much data loss is acceptable (RPO) and how long a restore may take (RTO)."] },
  ],
  "windows-server": [
    { title: "Active Directory in plain words", body: [
      "In a company, hundreds of PCs and users need central management: one login that works on any office PC, password rules, which shared drives each department sees. **Active Directory** is that central directory. A **domain controller** (DC) is the server that holds it."] },
    { title: "The building blocks", body: [
      "**Users** and **computers** are objects in the directory. **OUs** (organizational units) are folders to organize them, e.g. Students and Faculty. **Groups** grant access to resources. **GPOs** (Group Policy Objects) push settings to an OU: wallpaper, blocked Control Panel, mapped drives. They apply in LSDOU order, and the last one wins."] },
    { title: "DNS and DHCP: the hidden dependencies", body: [
      "Clients find the domain controller through **DNS**, so client PCs must use the DC as their DNS server, or domain join fails. **DHCP** hands out IP addresses automatically from a scope (e.g. .100–.200). Most AD problems in the lab are actually DNS problems.",
      "PowerShell automates all of it: creating hundreds of users from a CSV is a 5-line script instead of an afternoon of clicking."] },
  ],
};
