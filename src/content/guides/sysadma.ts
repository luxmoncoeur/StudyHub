import type { Guide } from "../types";

const VM = { title: "Start your Linux VM", body: ["Use the OrbStack VM from the *Set up your lab on a Mac* lesson."], commands: [{ cmd: "orb create ubuntu lab", purpose: "Create it (first time only)" }, { cmd: "orb -m lab", purpose: "Shell into it (or: ssh lab@orb)" }] };

export const guides: Record<string, Guide> = {
  "Linux 30-command sprint": {
    where: "OrbStack Ubuntu VM on your Mac",
    time: "1.5 hours",
    steps: [
      VM,
      { title: "Files & navigation (8)", commands: [
        { cmd: "pwd; ls -la; cd /etc; cd -", purpose: "Where am I, list, jump, jump back" },
        { cmd: "mkdir -p ~/lab/a/b && touch ~/lab/a/b/note.txt", purpose: "Nested dirs + empty file" },
        { cmd: "cp -r ~/lab ~/lab-copy && mv ~/lab-copy ~/lab-old", purpose: "Copy, rename" },
        { cmd: "find /etc -name '*.conf' | head", purpose: "Find by name" },
        { cmd: "grep -rn 'PermitRootLogin' /etc/ssh 2>/dev/null", purpose: "Search inside files" },
      ] },
      { title: "Permissions & users (8)", commands: [
        { cmd: "echo 'echo hi' > hi.sh && ./hi.sh", purpose: "Fails: Permission denied" },
        { cmd: "chmod u+x hi.sh && ./hi.sh && ls -l hi.sh", purpose: "Fix it, read the rwx" },
        { cmd: "sudo useradd -m -s /bin/bash juan && sudo passwd juan", purpose: "New user" },
        { cmd: "sudo usermod -aG sudo juan && id juan", purpose: "Make admin, verify" },
        { cmd: "sudo chown juan:juan hi.sh && ls -l hi.sh", purpose: "Change owner" },
      ] },
      { title: "Processes, packages, services (8)", commands: [
        { cmd: "sudo apt update && sudo apt install -y nginx htop", purpose: "Install" },
        { cmd: "systemctl status nginx", purpose: "Is it running?" },
        { cmd: "sudo systemctl stop nginx && sudo systemctl start nginx", purpose: "Stop / start" },
        { cmd: "ps aux | grep nginx; pgrep -a nginx", purpose: "Find the process" },
        { cmd: "htop", purpose: "Live view (q to quit)" },
      ] },
      { title: "Network & logs (6)", commands: [
        { cmd: "ip a; ip route", purpose: "IPs + gateway" },
        { cmd: "sudo ss -tulpn", purpose: "What listens on port 80?" },
        { cmd: "curl -I localhost", purpose: "Hit nginx" },
        { cmd: "journalctl -u nginx --since '10 min ago'", purpose: "Service logs" },
        { cmd: "df -h; free -h; uptime", purpose: "Disk, RAM, load" },
      ] },
      { title: "Write it down", body: ["Make `commands.md`: one line per command describing what it did and what surprised you. It becomes your reviewer."] },
    ],
    done: ["30 commands run, each explained in your own words.", "You can find which process listens on a port without help."],
  },
  "Break & fix": {
    where: "OrbStack Ubuntu VM",
    time: "1 hour",
    steps: [
      VM,
      { title: "Break 1: permissions", body: ["`chmod 000 hi.sh` then `./hi.sh`. Diagnose with `ls -l` and fix with `chmod 755`."] },
      { title: "Break 2: dead service", body: ["`sudo systemctl stop nginx`, then pretend you don't know why the site is down. Work through it: `curl -I localhost` → `systemctl status nginx` → `sudo ss -tulpn | grep :80` → `journalctl -u nginx -n 20`. Fix with `systemctl start`."] },
      { title: "Break 3: bad config", body: ["Add a typo to `/etc/nginx/sites-enabled/default` (delete a `;`). Run `sudo nginx -t`, which points to the exact line. Fix it and `sudo systemctl reload nginx`."] },
      { title: "Break 4: full disk", commands: [{ cmd: "fallocate -l 2G ~/big.bin && df -h /", purpose: "Eat disk space" }, { cmd: "du -sh ~/* | sort -h | tail", purpose: "Find the culprit" }, { cmd: "rm ~/big.bin", purpose: "Fix" }] },
    ],
    done: ["You diagnosed each break **before** fixing it.", "You wrote the troubleshooting order: symptom → status → ports → logs → fix."],
  },
  "Mac vs Linux": {
    where: "Mac Terminal + OrbStack VM side by side",
    time: "45 min",
    steps: [
      { title: "Two windows", body: ["Left: Mac Terminal (zsh, BSD tools). Right: `orb -m lab` (bash, GNU tools)."] },
      { title: "Run the same commands in both", commands: [
        { cmd: "sed -i 's/a/b/' f.txt", purpose: "Works on Linux. Fails on Mac (needs sed -i '' …)" },
        { cmd: "date -d yesterday", purpose: "GNU only. Mac: date -v-1d" },
        { cmd: "stat -c %s f.txt", purpose: "GNU. Mac: stat -f %z f.txt" },
        { cmd: "ip a", purpose: "Linux. Mac: ifconfig / ipconfig getifaddr en0" },
        { cmd: "free -h", purpose: "Linux. Mac: vm_stat" },
        { cmd: "systemctl status ssh", purpose: "Linux. Mac: launchctl list / brew services list" },
        { cmd: "bash --version", purpose: "Mac's /bin/bash is 3.2 (from 2007)" },
      ] },
      { title: "Explain", body: ["For 5 commands that differ, write *why*: macOS ships BSD userland plus launchd; Ubuntu ships GNU coreutils plus systemd."] },
    ],
    done: ["A table of 5+ differences with the fix for each."],
  },
  "Cron it": {
    where: "OrbStack Ubuntu VM",
    time: "40 min",
    steps: [
      VM,
      { title: "Install the backup script", body: ["Copy `backup.sh` from the *Bash scripting & cron* lesson into `~/bin/backup.sh`."], commands: [{ cmd: "mkdir -p ~/bin ~/projects && nano ~/bin/backup.sh", purpose: "Paste the script, save with Ctrl+O, exit with Ctrl+X" }, { cmd: "chmod +x ~/bin/backup.sh && ~/bin/backup.sh", purpose: "Make executable, run once by hand" }] },
      { title: "Schedule every 5 minutes", commands: [{ cmd: "crontab -e", purpose: "Add the line below, then save" }, { cmd: "*/5 * * * * /home/$USER/bin/backup.sh >> /home/$USER/backup.log 2>&1", purpose: "Every 5 min, log output and errors" }] },
      { title: "Verify", commands: [{ cmd: "ls -lh ~/backups; tail ~/backup.log", purpose: "New archive every 5 min?" }, { cmd: "grep CRON /var/log/syslog | tail", purpose: "Cron's own log" }] },
      { title: "Set it to daily", body: ["Change the line to `0 2 * * *` (02:00 daily). Use **crontab.guru** to double-check the schedule."] },
    ],
    done: ["Archives appear on schedule.", "You can read any 5-field cron expression."],
  },
  "Harden a fresh Ubuntu server": {
    where: "Multipass VM (a separate VM from OrbStack, so you can SSH into it like a real server)",
    time: "2 hours",
    steps: [
      { title: "Launch the server", commands: [{ cmd: "multipass launch --name srv1 24.04", purpose: "New Ubuntu server" }, { cmd: "multipass info srv1", purpose: "Note its IPv4 address" }, { cmd: "multipass shell srv1", purpose: "Log in" }] },
      { title: "Record the before state", commands: [{ cmd: "sudo ss -tulpn > before.txt", purpose: "Listening ports before hardening" }] },
      { title: "Admin user + SSH key", commands: [{ cmd: "sudo adduser juan && sudo usermod -aG sudo juan", purpose: "On srv1: your admin user" }, { cmd: "ssh-keygen -t ed25519", purpose: "On your Mac (skip if you have a key)" }, { cmd: "ssh-copy-id juan@<srv1-ip>", purpose: "On your Mac: install the key" }, { cmd: "ssh juan@<srv1-ip>", purpose: "Log in with the key, no password" }] },
      { title: "Lock down SSH", body: ["In `/etc/ssh/sshd_config` set `PasswordAuthentication no` and `PermitRootLogin no`, then `sudo systemctl reload ssh`. **Test from a NEW terminal before closing the old one.**"] },
      { title: "Firewall, fail2ban, auto-updates", commands: [{ cmd: "sudo ufw allow OpenSSH && sudo ufw enable && sudo ufw status verbose", purpose: "Firewall: SSH first!" }, { cmd: "sudo apt install -y fail2ban unattended-upgrades", purpose: "Brute-force protection + security patches" }, { cmd: "sudo systemctl enable --now fail2ban && sudo fail2ban-client status sshd", purpose: "Confirm the jail is active" }] },
      { title: "After state + write-up", commands: [{ cmd: "sudo ss -tulpn > after.txt && diff before.txt after.txt", purpose: "Compare" }], body: ["Write a 1-page report: each change, why, and how you verified it."] },
    ],
    done: ["Password login is refused (`ssh -o PubkeyAuthentication=no juan@ip` fails).", "ufw is active, fail2ban jail running, report written."],
  },
  "LEMP host + nightly backups": {
    where: "Multipass or OrbStack VM",
    time: "1 weekend",
    steps: [
      { title: "Install the stack", commands: [{ cmd: "sudo apt install -y nginx mysql-server", purpose: "Linux + nginx + MySQL" }, { cmd: "sudo mysql_secure_installation", purpose: "Secure MySQL" }] },
      { title: "Host an app", body: ["Copy a project (e.g. the HR API) to `/var/www/hr`, run it with Node on port 4000, and add an nginx reverse proxy: `location / { proxy_pass http://127.0.0.1:4000; }`. Test with `sudo nginx -t` and reload."] },
      { title: "Nightly backup script", code: { title: "/usr/local/bin/nightly.sh", variants: { bash: `#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date +%F)
DEST=/var/backups/site
mkdir -p "$DEST"
mysqldump --single-transaction company > "$DEST/db-$STAMP.sql"
tar -czf "$DEST/files-$STAMP.tar.gz" -C /var/www hr
find "$DEST" -mtime +7 -delete
echo "OK $STAMP"` } }, commands: [{ cmd: "sudo crontab -e  →  0 2 * * * /usr/local/bin/nightly.sh >> /var/log/nightly.log 2>&1", purpose: "Run daily at 02:00 as root" }] },
      { title: "Prove the restore", body: ["Drop the DB (`mysql -e 'DROP DATABASE company'`), restore it (`mysql -e 'CREATE DATABASE company' && mysql company < db-DATE.sql`), and confirm the app works. Screenshot it, because a backup you haven't restored isn't a backup."] },
    ],
    done: ["The site is served through nginx.", "Backups appear nightly and a test restore is documented."],
  },
  "Two-server backup lab": {
    where: "2 Multipass VMs",
    time: "2 hours",
    steps: [
      { title: "Two servers", commands: [{ cmd: "multipass launch --name web 24.04 && multipass launch --name backup 24.04", purpose: "A = web, B = backup" }, { cmd: "multipass list", purpose: "Note both IPs" }] },
      { title: "Key from backup → web", body: ["On **backup**: `ssh-keygen -t ed25519` (no passphrase, for automation), then copy `~/.ssh/id_ed25519.pub` into web's `~/.ssh/authorized_keys`."] },
      { title: "Pull with rsync", commands: [{ cmd: "rsync -avz -e ssh ubuntu@<web-ip>:/var/www/ ~/web-backup/", purpose: "Run on backup: pull the web root" }] },
      { title: "Automate it", commands: [{ cmd: "crontab -e  →  0 3 * * * rsync -az -e ssh ubuntu@<web-ip>:/var/www/ /home/ubuntu/web-backup/", purpose: "Nightly pull at 03:00" }] },
      { title: "Disaster test", body: ["Delete a file on web, restore it by rsyncing back from backup. Explain why **pulling** (backup logs into web) is safer than pushing: a hacked web server can't delete its own backups."] },
    ],
    done: ["Passwordless rsync works from backup to web.", "Restore test documented."],
  },
  "Active Directory lab": {
    where: "Azure for Students (x64 Windows Server) — Apple Silicon can't run Windows Server",
    time: "1 weekend",
    youNeed: ["Azure for Students ($100 credit, school email, no card)", "Microsoft Remote Desktop / Windows App on your Mac"],
    steps: [
      { title: "Create the VMs", body: ["Azure portal → **Virtual machines → Create**. Image: **Windows Server 2022 Datacenter**, size B2s. Then a second VM: Windows 11 (client), **same virtual network**.", "Set **auto-shutdown** on both (Operations → Auto-shutdown) to protect your credit."] },
      { title: "Promote the DC", body: ["RDP into the server (Windows App on your Mac). Open PowerShell as Administrator and run the commands below. The server reboots."], code: { title: "On the server", variants: { powershell: `Install-WindowsFeature AD-Domain-Services -IncludeManagementTools
Install-ADDSForest -DomainName "lab.local" -InstallDns` } } },
      { title: "OUs and users from CSV", code: { title: "users.csv + import", variants: { powershell: `# users.csv
# Name,Sam,Pass
# Juan Cruz,jcruz,P@ssw0rd!2026
# Ana Reyes,areyes,P@ssw0rd!2026

New-ADOrganizationalUnit -Name "Students" -Path "DC=lab,DC=local"
Import-Csv .\\users.csv | ForEach-Object {
  New-ADUser -Name $_.Name -SamAccountName $_.Sam -Path "OU=Students,DC=lab,DC=local" \`
    -AccountPassword (ConvertTo-SecureString $_.Pass -AsPlainText -Force) -Enabled $true
}
Get-ADUser -Filter * -SearchBase "OU=Students,DC=lab,DC=local" | Select Name, SamAccountName` } } },
      { title: "Join the client", body: ["In Azure, set the VNet's **DNS server** to the DC's private IP (AD needs it). Restart the client, then run `Add-Computer -DomainName lab.local -Restart` and log in as `LAB\\jcruz`."] },
      { title: "One GPO", body: ["On the DC: `New-GPO -Name \"Student Policy\" | New-GPLink -Target \"OU=Students,DC=lab,DC=local\"`. Edit it in Group Policy Management (e.g. prohibit Control Panel). On the client: `gpupdate /force` and `gpresult /r`."] },
    ],
    done: ["The client is joined to lab.local and a CSV user can log in.", "The GPO visibly applies.", "VMs are **stopped/deallocated** when you're done."],
  },
  "Monitoring dashboard": {
    where: "OrbStack Docker on your Mac",
    time: "1.5 hours",
    steps: [
      { title: "Run Uptime Kuma", commands: [{ cmd: "docker run -d --name kuma -p 3001:3001 -v kuma:/app/data louislam/uptime-kuma:1", purpose: "Start it, then open http://localhost:3001" }] },
      { title: "Add monitors", body: ["Create an admin account, then **Add New Monitor**: HTTP for your nginx VM (`http://<vm-ip>`), TCP port 22 for SSH, and ping for each VM."] },
      { title: "Break something", body: ["`sudo systemctl stop nginx` on the VM. Watch Kuma turn red within the check interval. Start it again and it turns green."] },
      { title: "Disk alerts", body: ["Add `diskcheck.sh` (Bash scripting lesson) to cron on the VM. Bonus: use a Kuma **Push** monitor, where the script curls the push URL only when the disk is OK."] },
    ],
    done: ["The dashboard shows all VMs and services.", "A stopped service shows as down, with timestamps."],
  },
};
