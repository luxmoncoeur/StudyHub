import type { Course } from "./types";

export const sysadma: Course = {
  code: "SYSADMA",
  slug: "sysadma",
  title: "System Administration and Maintenance",
  units: 3,
  accent: "#60a5fa",
  tagline: "Linux and Windows Server admin, practiced from your Mac.",
  ched: "Core BSIT course (CMO 25 s.2015). Install, configure and maintain Linux and Windows server OSes. Manage users, permissions and services (SSH, DNS, DHCP, web, AD). Automate with scripts, and secure, monitor, back up and restore systems.",
  lessons: [
    {
      slug: "mac-lab",
      title: "Set up your lab on a Mac",
      why: "Your Mac runs Linux VMs natively. Windows Server needs a different route.",
      points: [
        "**Linux**: OrbStack (fastest, free for personal use) or Multipass/UTM. Use a VM, not a Docker container, because containers have no systemd.",
        "**Windows Server has no ARM build** and Microsoft has no plans for one. Use **Azure for Students** ($100 credit, no card) or the school lab.",
        "**Windows 11 ARM** in UTM or Parallels works for client-side PowerShell and domain-join practice.",
        "`pwsh` (PowerShell 7) runs on macOS for syntax practice, but the AD, DHCP and GPO modules don't.",
      ],
      commands: [
        { cmd: "brew install --cask orbstack", purpose: "Install OrbStack (Linux VMs + Docker)", os: "mac" },
        { cmd: "orb create ubuntu lab", purpose: "Create an Ubuntu VM named lab", os: "mac" },
        { cmd: "orb -m lab", purpose: "Open a shell inside the VM (or: ssh lab@orb)", os: "mac" },
        { cmd: "brew install --cask multipass", purpose: "Install Canonical's Ubuntu VM manager", os: "mac" },
        { cmd: "multipass launch --name srv1 --cpus 2 --memory 2G --disk 15G 24.04", purpose: "Launch an Ubuntu 24.04 server VM", os: "mac" },
        { cmd: "multipass shell srv1", purpose: "Shell into the VM", os: "mac" },
        { cmd: "brew install --cask powershell", purpose: "PowerShell 7 on macOS (run with pwsh)", os: "mac" },
      ],
    },
    {
      slug: "filesystem",
      title: "Filesystem & navigation",
      why: "You need to know where configs, logs and programs live.",
      points: [
        "`/etc` config · `/var/log` logs · `/home` users · `/usr/bin` programs · `/tmp` temp · `/dev` devices · `/proc` `/sys` kernel · `/opt` add-ons.",
        "macOS is UNIX (BSD), so most commands work, but some flags differ from Linux (GNU).",
        "Mac gotchas: `sed -i '' …`, `date -v-1d` instead of `date -d yesterday`, `stat -f` instead of `stat -c`. macOS's built-in bash is the old 3.2.",
        "Want GNU tools on your Mac? `brew install coreutils gnu-sed` gives you `gls`, `gsed` and friends.",
      ],
      commands: [
        { cmd: "pwd · ls -la · cd -", purpose: "Where am I, list everything including hidden files, go back" },
        { cmd: "find /etc -name '*.conf'", purpose: "Find files by name" },
        { cmd: "grep -rn \"PermitRootLogin\" /etc/ssh", purpose: "Search text inside files, with line numbers" },
        { cmd: "tail -f /var/log/syslog", purpose: "Follow a log live", os: "linux" },
        { cmd: "du -sh /var/* | sort -h", purpose: "What's using the disk" },
        { cmd: "man <command>", purpose: "Read the manual" },
      ],
    },
    {
      slug: "permissions",
      title: "Permissions & ownership",
      why: "Permission errors are among the most common things you'll fix as a sysadmin.",
      points: [
        "`rwx` = 4/2/1 for owner, group and others. `755` = rwxr-xr-x (scripts, dirs). `644` = rw-r--r-- (files). `600` = private keys.",
        "`chmod u+x script.sh` adds execute for the owner. `chown juan:devs file` changes the owner and group.",
        "Special bits: setuid (4), setgid (2, new files inherit the dir's group), sticky (1, like `/tmp`).",
        "`umask 022` means new files get 644 and new dirs get 755.",
      ],
      demo: "chmod",
      commands: [
        { cmd: "chmod 640 file", purpose: "Owner rw, group r, others none" },
        { cmd: "chmod -R g+w shared/", purpose: "Give the group write access, recursively" },
        { cmd: "sudo chown -R www-data:www-data /var/www/site", purpose: "Hand a web root to the web server user", os: "linux" },
        { cmd: "icacls file /grant juan:R", purpose: "Windows equivalent: grant read", os: "windows" },
      ],
    },
    {
      slug: "users",
      title: "Users, groups & sudo",
      why: "Least privilege: everyone gets their own account and only the access they need.",
      points: [
        "User info is in `/etc/passwd`, password hashes are in `/etc/shadow`, and groups are in `/etc/group`.",
        "Admin rights come from the `sudo` group (Ubuntu) or `wheel` (RHEL).",
        "Only edit sudoers with `sudo visudo`, which checks syntax so you can't lock yourself out.",
      ],
      code: [{
        title: "Create an admin user",
        variants: {
          bash: `sudo useradd -m -s /bin/bash juan
sudo passwd juan
sudo usermod -aG sudo juan      # -a = append (without it you REPLACE all groups)
id juan`,
          zsh: `sudo sysadminctl -addUser juan -password -
sudo dseditgroup -o edit -a juan -t user admin
id juan`,
          powershell: `New-LocalUser juan -Password (Read-Host -AsSecureString "Password")
Add-LocalGroupMember -Group Administrators -Member juan
# Domain: New-ADUser (see Windows Server lesson)`,
        },
      }],
    },
    {
      slug: "processes-services",
      title: "Processes & services",
      why: "Is it running? Why did it die? Restart it properly.",
      points: [
        "`kill -15` asks a process to stop cleanly. `kill -9` forces it, so use it only as a last resort.",
        "Linux uses **systemd** (`systemctl`), macOS uses **launchd** (`launchctl`, or `brew services`), and Windows uses the Service Control Manager.",
        "`enable --now` = start now and at every boot. Run `daemon-reload` after editing a unit file.",
      ],
      code: [{
        title: "Check and restart a service",
        variants: {
          bash: `systemctl status nginx
sudo systemctl restart nginx
sudo systemctl enable --now nginx
systemctl list-units --failed`,
          zsh: `brew services list
brew services restart nginx
launchctl list | grep nginx`,
          powershell: `Get-Service W32Time
Restart-Service W32Time
Set-Service W32Time -StartupType Automatic`,
        },
      }, {
        title: "Find and kill a process",
        variants: {
          bash: `ps aux | grep nginx
pgrep -a nginx
htop
kill -15 <PID>`,
          zsh: `ps aux | grep nginx
top -o cpu
kill -15 <PID>`,
          powershell: `Get-Process | Sort-Object CPU -Descending | Select-Object -First 10
Stop-Process -Name nginx`,
        },
      }],
    },
    {
      slug: "packages",
      title: "Packages & updates",
      why: "Patching is your first line of security.",
      points: [
        "Debian/Ubuntu: `apt`. RHEL/Rocky/Fedora: `dnf`. macOS: Homebrew. Windows: `winget`.",
        "`apt update` refreshes the package list and `apt upgrade` installs the updates. They are different steps.",
        "Turn on `unattended-upgrades` on servers so security patches install automatically.",
      ],
      code: [{
        title: "Install and update",
        variants: {
          bash: `sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx htop ufw
apt search mysql`,
          zsh: `brew update && brew upgrade
brew install htop
softwareupdate -l        # macOS system updates`,
          powershell: `winget install Git.Git
winget upgrade --all`,
        },
      }],
    },
    {
      slug: "networking",
      title: "Networking & SSH",
      why: "Most server work happens over SSH, and most outages turn out to be network issues.",
      points: [
        "`ss -tulpn` shows what is listening on which port. It's the first thing to run when a service \"won't connect\".",
        "Use **SSH keys**, not passwords. `ed25519` is the modern default.",
        "Harden `/etc/ssh/sshd_config` with `PasswordAuthentication no` and `PermitRootLogin no`. Test from a second session before you log out.",
        "Ubuntu network config lives in `/etc/netplan/*.yaml`. Apply it with `sudo netplan apply`.",
      ],
      code: [{
        title: "Who's listening?",
        variants: {
          bash: `ip a                 # my IP addresses
ip route             # default gateway
sudo ss -tulpn       # listening ports + process
dig example.com +short
nc -zv host 22       # is port 22 open?`,
          zsh: `ipconfig getifaddr en0
netstat -rn
sudo lsof -iTCP -sTCP:LISTEN -n -P
dig example.com +short
nc -zv host 22`,
          powershell: `Get-NetIPAddress
Get-NetRoute
Get-NetTCPConnection -State Listen
Resolve-DnsName example.com
Test-NetConnection host -Port 22`,
        },
      }, {
        title: "SSH key login",
        variants: {
          zsh: `ssh-keygen -t ed25519 -C "juan@mac"
ssh-copy-id juan@server
ssh juan@server

# ~/.ssh/config, so later you can just type: ssh lab
Host lab
  HostName 192.168.64.5
  User juan`,
        },
      }],
    },
    {
      slug: "firewall-security",
      title: "Firewall & hardening",
      why: "A new server is attacked within minutes of going online.",
      points: [
        "**Allow SSH before enabling ufw**, or you'll lock yourself out.",
        "`fail2ban` bans IPs after repeated failed logins.",
        "Hardening checklist: a new sudo user, key-only SSH, no root login, ufw, fail2ban, unattended-upgrades, and closing unused ports.",
      ],
      commands: [
        { cmd: "sudo ufw allow OpenSSH && sudo ufw enable", purpose: "Allow SSH first, then turn on the firewall", os: "linux" },
        { cmd: "sudo ufw allow 80,443/tcp", purpose: "Open the web ports", os: "linux" },
        { cmd: "sudo ufw status verbose", purpose: "Show the firewall rules", os: "linux" },
        { cmd: "sudo apt install fail2ban", purpose: "Auto-ban brute-force IPs", os: "linux" },
        { cmd: "New-NetFirewallRule -DisplayName SSH -Direction Inbound -Protocol TCP -LocalPort 22 -Action Allow", purpose: "Windows firewall rule", os: "windows" },
      ],
    },
    {
      slug: "logs-monitoring",
      title: "Logs & monitoring",
      why: "Logs tell you what went wrong. Monitoring tells you before users do.",
      points: [
        "Linux: `journalctl` plus files in `/var/log`. Login attempts are in `/var/log/auth.log`.",
        "Health basics: `df -h` (disk), `free -h` (RAM), `uptime` (load), `df -i` (inodes, the sneaky reason a disk shows as full).",
        "Tools: Netdata, Prometheus + Grafana, Zabbix, Uptime Kuma (easy in Docker).",
      ],
      code: [{
        title: "Read logs",
        variants: {
          bash: `journalctl -u ssh --since "1 hour ago"
journalctl -p err -b      # errors since boot
journalctl -f             # follow live
sudo tail -f /var/log/auth.log`,
          zsh: `log show --last 1h --predicate 'process == "sshd"'
log stream`,
          powershell: `Get-WinEvent -LogName System -MaxEvents 20
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625} -MaxEvents 10   # failed logons`,
        },
      }],
    },
    {
      slug: "scripting-cron",
      title: "Bash scripting & cron",
      why: "Anything you do twice should be a script, and anything you do daily should run on cron.",
      points: [
        "Start scripts with `#!/usr/bin/env bash` and `set -euo pipefail` (stop on errors).",
        "Always quote variables: `\"$VAR\"`. Arguments are `$1 $2`, `$#` is the count and `$?` is the last exit code.",
        "Cron fields: `min hour day month weekday`. Cron runs with a minimal PATH, so use absolute paths.",
      ],
      code: [{
        title: "backup.sh: timestamped tar, keep 7 days (Linux + macOS)",
        variants: {
          bash: `#!/usr/bin/env bash
set -euo pipefail
SRC="\${1:-$HOME/projects}"
DEST="\${2:-$HOME/backups}"
mkdir -p "$DEST"
STAMP=$(date +%Y%m%d-%H%M%S)
tar -czf "$DEST/backup-$STAMP.tar.gz" -C "$(dirname "$SRC")" "$(basename "$SRC")"
find "$DEST" -name 'backup-*.tar.gz' -mtime +7 -delete
echo "OK: $DEST/backup-$STAMP.tar.gz"`,
          powershell: `$src  = "$HOME\\projects"
$dest = "$HOME\\backups"
New-Item -ItemType Directory -Force $dest | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
Compress-Archive -Path $src -DestinationPath "$dest\\backup-$stamp.zip"
Get-ChildItem $dest -Filter "backup-*.zip" |
  Where-Object LastWriteTime -lt (Get-Date).AddDays(-7) | Remove-Item`,
        },
      }, {
        title: "diskcheck.sh: warn at 80%",
        variants: {
          bash: `#!/usr/bin/env bash
USE=$(df -P / | awk 'NR==2 {gsub("%","",$5); print $5}')
if [ "$USE" -ge 80 ]; then echo "WARN: / at \${USE}%"; exit 1; else echo "OK: / at \${USE}%"; fi`,
        },
      }],
      commands: [
        { cmd: "crontab -e", purpose: "Edit your scheduled jobs" },
        { cmd: "0 2 * * * /home/juan/bin/backup.sh >> /home/juan/backup.log 2>&1", purpose: "Run the backup daily at 02:00 and log output and errors" },
        { cmd: "systemctl list-timers", purpose: "systemd's alternative to cron", os: "linux" },
        { cmd: "Register-ScheduledTask", purpose: "Windows scheduled task", os: "windows" },
      ],
    },
    {
      slug: "backups",
      title: "Backups & restore",
      why: "A backup you've never restored is not a backup.",
      points: [
        "**3-2-1**: 3 copies, on 2 media types, with 1 offsite.",
        "`rsync` copies only what changed. A trailing slash on the source (`src/`) means \"the contents of src\".",
        "For databases, dump them (`pg_dump`, `mysqldump`) instead of copying the data files.",
      ],
      commands: [
        { cmd: "rsync -avh --delete ~/site/ /mnt/backup/site/", purpose: "Mirror a folder (deletes extras at the destination)" },
        { cmd: "rsync -avz -e ssh dir/ user@host:/backup/dir/", purpose: "Back up to another server over SSH" },
        { cmd: "tar -czvf etc-$(date +%F).tar.gz /etc", purpose: "Archive /etc with today's date" },
        { cmd: "tar -xzf file.tar.gz -C /restore", purpose: "Restore (extract) to a folder" },
        { cmd: "robocopy src dst /MIR", purpose: "Windows mirror copy", os: "windows" },
      ],
    },
    {
      slug: "windows-server",
      title: "Windows Server: AD, DNS, DHCP, GPO",
      why: "Most PH companies and schools run Active Directory.",
      points: [
        "**Domain** = a group of managed machines and users. **DC** = the server holding AD. **OU** = a folder for users and computers that you can apply policy to.",
        "AD depends on DNS: clients must use the DC as their DNS server or domain join fails.",
        "GPO order: **LSDOU** (Local → Site → Domain → OU, the last one applied wins).",
        "NTFS vs share permissions: when both apply, the most restrictive wins.",
        "Practice this on an x64 Azure VM or in the school lab. It won't run on Apple Silicon.",
      ],
      code: [{
        title: "Domain controller, OU, user, DHCP, DNS, GPO",
        variants: {
          powershell: `# Promote the first DC (new forest). The server reboots.
Install-WindowsFeature AD-Domain-Services -IncludeManagementTools
Install-ADDSForest -DomainName "lab.local" -InstallDns

# OU + user
New-ADOrganizationalUnit -Name "Students" -Path "DC=lab,DC=local"
New-ADUser -Name "Juan Cruz" -SamAccountName jcruz -Path "OU=Students,DC=lab,DC=local" \`
  -AccountPassword (Read-Host -AsSecureString "Password") -Enabled $true

# Bulk users from CSV
Import-Csv users.csv | ForEach-Object {
  New-ADUser -Name $_.Name -SamAccountName $_.Sam -Path "OU=Students,DC=lab,DC=local" \`
    -AccountPassword (ConvertTo-SecureString $_.Pass -AsPlainText -Force) -Enabled $true
}

# DHCP
Install-WindowsFeature DHCP -IncludeManagementTools
Add-DhcpServerInDC -DnsName "dc1.lab.local" -IPAddress 192.168.50.10
Add-DhcpServerv4Scope -Name "LAB" -StartRange 192.168.50.100 -EndRange 192.168.50.200 -SubnetMask 255.255.255.0

# DNS A record
Add-DnsServerResourceRecordA -ZoneName "lab.local" -Name "web" -IPv4Address 192.168.50.20

# GPO linked to an OU (on the client: gpupdate /force ; gpresult /r)
New-GPO -Name "Student Policy" | New-GPLink -Target "OU=Students,DC=lab,DC=local"`,
        },
      }],
    },
  ],
  activities: [
    { title: "Linux 30-command sprint", steps: ["Create the OrbStack VM.", "Run every command in Filesystem, Permissions, Users and Processes.", "Write one line on what each one did."] },
    { title: "Break & fix", steps: ["chmod 000 a script and try to run it, then fix it.", "Stop nginx and diagnose it with systemctl status, ss -tulpn and journalctl.", "Fill / with a big file (fallocate -l 2G big) and run diskcheck.sh."] },
    { title: "Mac vs Linux", steps: ["Run each Code tab on your Mac (macOS) and in the VM (Linux).", "List 5 commands that behaved differently and explain why (BSD vs GNU)."] },
    { title: "Cron it", steps: ["Install backup.sh in ~/bin.", "Schedule it every 5 minutes, confirm the archives appear, then set it to daily."] },
  ],
  projects: [
    { title: "Harden a fresh Ubuntu server", level: "Starter", scope: "New sudo user, key-only SSH, ufw, fail2ban, unattended-upgrades. Document the ss -tulpn output before and after.", stack: ["Ubuntu", "ssh", "ufw"] },
    { title: "LEMP host + nightly backups", level: "Core", scope: "nginx + MySQL hosting a team web app, with cron backups (tar + mysqldump) and a documented test restore.", stack: ["nginx", "MySQL", "cron", "bash"] },
    { title: "Two-server backup lab", level: "Core", scope: "VM A serves the site and VM B pulls rsync backups over SSH keys every night.", stack: ["Multipass", "rsync", "ssh"] },
    { title: "Active Directory lab", level: "Stretch", scope: "A DC plus a Windows client joined to lab.local. OUs, users imported from CSV, and one GPO.", stack: ["Azure for Students", "PowerShell", "AD DS"] },
    { title: "Monitoring dashboard", level: "Stretch", scope: "Uptime Kuma or Netdata in Docker watching your VMs, plus diskcheck.sh alerts.", stack: ["Docker", "Uptime Kuma"] },
  ],
};
