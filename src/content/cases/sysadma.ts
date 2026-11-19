import type { LessonCase, Project } from "../types";

export const cases: Record<string, LessonCase[]> = {
  "mac-lab": [{
    title: "\"No compatible bootloader found\"",
    scenario: "A student downloaded the Windows Server 2025 ISO and tried to boot it in UTM on an M2 MacBook. It never starts.",
    steps: ["Released Windows Server media is **x64 only**, and Apple Silicon is ARM64.", "For Linux labs, use OrbStack or Multipass (native ARM, fast).", "For AD/DNS/DHCP, use an Azure for Students x64 VM or the school lab.", "Windows 11 ARM in UTM covers client-side PowerShell and domain join."],
    takeaway: "Pick the tool that matches the CPU architecture.",
  }],
  filesystem: [{
    title: "Where did nginx put its logs?",
    scenario: "The org website shows a 502 error. You're asked to find the error log on a server you've never seen.",
    steps: ["Logs live under `/var/log`: `ls /var/log/nginx` → `error.log`.", "`sudo tail -n 50 /var/log/nginx/error.log` shows the last errors.", "Config is under `/etc`: `/etc/nginx/sites-enabled/`.", "Lost? `sudo find / -name 'error.log' 2>/dev/null`."],
    takeaway: "Learn the FHS map: /etc = config, /var/log = logs, /var/www = sites.",
  }],
  permissions: [{
    title: "Permission denied on upload",
    scenario: "The PHP app can't save uploaded files to `/var/www/site/uploads`. The error says *Permission denied*.",
    steps: ["`ls -ld /var/www/site/uploads` shows the owner is root with 755: the web server user can't write.", "`sudo chown -R www-data:www-data /var/www/site/uploads`.", "Keep it 755 for directories (and 644 for files). Don't `chmod 777`.", "Retry the upload, then check `ls -l` shows www-data as the owner."],
    takeaway: "Fix ownership, not by giving everyone write access.",
  }],
  users: [{
    title: "The new officer can't use sudo",
    scenario: "You created an account for the new org tech officer, but `sudo apt update` says *juan is not in the sudoers file*.",
    steps: ["`id juan`: no `sudo` group.", "`sudo usermod -aG sudo juan`. The `-a` matters: without it you **replace** all his groups.", "He must log out and back in for the group to apply.", "When he leaves the org: `sudo deluser juan` or lock the account with `sudo usermod -L juan`."],
    takeaway: "Admin rights = group membership, so use `-aG` and audit the group regularly.",
  }],
  "processes-services": [{
    title: "The site dies every time the server reboots",
    scenario: "After a power interruption the server came back, but the website was down until someone ran `systemctl start nginx` by hand.",
    steps: ["The service was started but never **enabled**.", "`sudo systemctl enable --now nginx` starts it now **and** at every boot.", "Verify: `systemctl is-enabled nginx` → enabled.", "Test it safely: `sudo reboot`, then `curl -I localhost`."],
    takeaway: "start = now. enable = every boot. Production services need both.",
  }],
  packages: [{
    title: "\"Unable to locate package\"",
    scenario: "On a fresh Ubuntu VM, `sudo apt install nginx` fails with *Unable to locate package nginx*.",
    steps: ["The package list is empty or stale. Run `sudo apt update` first.", "Then `sudo apt install -y nginx`.", "Remember: update = refresh the list, upgrade = install newer versions.", "Turn on `unattended-upgrades` so security patches install automatically."],
    takeaway: "apt update before apt install, always on a fresh machine.",
  }],
  networking: [{
    title: "Site works on the server, not from your laptop",
    scenario: "`curl localhost:3000` works when SSH'd into the server, but the browser on your Mac times out.",
    steps: ["`sudo ss -tulpn | grep 3000` shows it listening on `127.0.0.1:3000`, so it accepts **local** connections only.", "Bind the app to `0.0.0.0`, or (better) put nginx on port 80 in front.", "Check the firewall: `sudo ufw status` and allow 80/tcp if needed.", "Test from the Mac: `nc -zv <server-ip> 80`."],
    takeaway: "\"Works locally, not remotely\" means checking the bind address, then the firewall, then routing.",
  }],
  "firewall-security": [{
    title: "Locked out after enabling the firewall",
    scenario: "A student ran `sudo ufw enable` over SSH and the session froze. They can't log back in.",
    steps: ["ufw's default policy denies incoming traffic, including SSH on port 22.", "Recovery: use the provider's console or `multipass shell`, then `sudo ufw allow OpenSSH`.", "Correct order next time: `ufw allow OpenSSH` **then** `ufw enable`.", "Keep a second SSH session open whenever you change the firewall or sshd."],
    takeaway: "Allow SSH before enabling the firewall, and keep a backup session open.",
  }],
  "logs-monitoring": [{
    title: "Thousands of failed logins at 3 AM",
    scenario: "The server feels slow. `/var/log/auth.log` is huge.",
    steps: ["`sudo grep 'Failed password' /var/log/auth.log | tail` shows bots guessing root passwords.", "Count attackers: `… | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head`.", "Fix: key-only SSH, `PermitRootLogin no`, and install **fail2ban**.", "Monitor: `sudo fail2ban-client status sshd` shows the banned IPs."],
    takeaway: "Read auth logs on any public server. Bots start within minutes.",
  }],
  "scripting-cron": [{
    title: "The cron job that never ran",
    scenario: "`backup.sh` works when you run it, but the cron entry produced no backups for a week.",
    steps: ["Cron uses a minimal PATH and runs from `$HOME`, so relative paths and some commands fail.", "Use absolute paths in the crontab **and** inside the script.", "Log output: `… >> /home/juan/backup.log 2>&1` (most failures are visible there).", "Check that cron ran it: `grep CRON /var/log/syslog`."],
    takeaway: "Cron jobs need absolute paths and logging.",
  }],
  backups: [{
    title: "The backup that was empty",
    scenario: "The disk failed. The \"nightly backups\" turned out to be 0-byte files for the past month.",
    steps: ["The script failed silently (wrong DB password) and nobody checked.", "Add `set -euo pipefail` so errors stop the script, and alert on a non-zero exit.", "Check the size: `find /var/backups -size -1k` (should be empty).", "Do a monthly **restore drill** into a test database."],
    takeaway: "A backup only counts if you've restored it.",
  }],
  "windows-server": [{
    title: "The PC can't join the domain",
    scenario: "Adding a Windows 11 client to `lab.local` fails: *An Active Directory Domain Controller could not be contacted*.",
    steps: ["AD runs on DNS. The client is using the router or ISP DNS, which doesn't know lab.local.", "Set the client's DNS server to the **DC's IP**.", "Test: `nslookup lab.local` should return the DC.", "Then `Add-Computer -DomainName lab.local -Restart`."],
    takeaway: "Most AD problems are DNS problems.",
  }],
};

export const caseProject: Project = {
  title: "Case: Deploy the org's web server",
  level: "Core",
  scope: "From scratch: set up a hardened Ubuntu server for a student org website, with officer accounts, nginx, a firewall, backups and monitoring, all verified with test cases.",
  stack: ["Multipass", "Ubuntu 24.04", "nginx", "ufw", "cron"],
  guide: {
    where: "Multipass Ubuntu VM on your Mac",
    time: "1 weekend",
    brief: {
      client: "JPCS (student org) Chapter, IT Department",
      problem: "The org's website runs on a former officer's laptop. It goes down whenever the laptop sleeps, and everyone shares one password.",
      requirements: [
        "Ubuntu server named `jpcs-web` serving the site over nginx on port 80.",
        "Personal accounts for 3 officers: `pres` (sudo), `webdev` (can edit the site, no sudo), `pro` (read-only).",
        "SSH with keys only; no root login; no passwords.",
        "Firewall allows only SSH and HTTP.",
        "Nightly backup of `/var/www/jpcs` at 02:00, keeping 7 days.",
        "The site comes back automatically after a reboot.",
      ],
    },
    tests: [
      { id: "TC-01", scenario: "Site is up", steps: "`curl -I http://<ip>` from your Mac", expected: "`HTTP/1.1 200 OK`" },
      { id: "TC-02", scenario: "Survives reboot", steps: "`sudo reboot`, wait, repeat TC-01", expected: "200 without touching anything" },
      { id: "TC-03", scenario: "webdev can edit the site", steps: "As webdev: `echo hi >> /var/www/jpcs/index.html`", expected: "Succeeds" },
      { id: "TC-04", scenario: "webdev has no sudo", steps: "As webdev: `sudo ls /root`", expected: "*webdev is not in the sudoers file*" },
      { id: "TC-05", scenario: "pro is read-only", steps: "As pro: try to edit index.html", expected: "*Permission denied*" },
      { id: "TC-06", scenario: "No password login", steps: "`ssh -o PubkeyAuthentication=no pres@<ip>`", expected: "*Permission denied (publickey)*" },
      { id: "TC-07", scenario: "Firewall", steps: "`nc -zv <ip> 3306` from the Mac", expected: "Connection refused or timed out" },
      { id: "TC-08", scenario: "Backup", steps: "Run the backup script by hand, then `ls -lh /var/backups/jpcs`", expected: "A dated .tar.gz larger than 0 bytes" },
      { id: "TC-09", scenario: "Restore drill", steps: "Delete index.html, restore it from the archive", expected: "The site shows the restored page" },
    ],
    steps: [
      { title: "Understand the brief", body: ["Map each requirement to a lesson: users → *Users & sudo*, permissions → *Permissions*, SSH → *Networking & SSH*, ufw → *Firewall*, cron → *Bash scripting & cron*."] },
      { title: "Launch the server", commands: [{ cmd: "multipass launch --name jpcs-web 24.04", purpose: "New VM" }, { cmd: "multipass shell jpcs-web", purpose: "Log in" }, { cmd: "sudo apt update && sudo apt install -y nginx", purpose: "Web server" }] },
      { title: "Accounts and a shared web group", body: ["The trick for TC-03/TC-05: a `webeditors` group owns the site folder with group-write. webdev is in it; pro is not."],
        commands: [
          { cmd: "for u in pres webdev pro; do sudo adduser --disabled-password --gecos '' $u; done", purpose: "3 accounts (key login only)" },
          { cmd: "sudo usermod -aG sudo pres", purpose: "Only pres is admin" },
          { cmd: "sudo groupadd webeditors && sudo usermod -aG webeditors webdev", purpose: "Editors group" },
          { cmd: "sudo mkdir -p /var/www/jpcs && sudo chown -R root:webeditors /var/www/jpcs && sudo chmod -R 2775 /var/www/jpcs", purpose: "setgid 2: new files inherit the group" },
        ] },
      { title: "Point nginx at the site", body: ["Edit `/etc/nginx/sites-available/default` and set `root /var/www/jpcs;`. Then run `sudo nginx -t && sudo systemctl reload nginx` and `sudo systemctl enable nginx` (for TC-02)."] },
      { title: "SSH keys, then lock down", body: ["Copy your Mac's public key into each user's `~/.ssh/authorized_keys`. Then set `PasswordAuthentication no` and `PermitRootLogin no` in sshd_config, and reload. **Test from a new terminal first.**"] },
      { title: "Firewall", commands: [{ cmd: "sudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw enable", purpose: "SSH first, then enable" }] },
      { title: "Backups", body: ["Reuse `backup.sh` from the *Bash scripting & cron* lesson: `sudo crontab -e` → `0 2 * * * /usr/local/bin/backup.sh /var/www/jpcs /var/backups/jpcs >> /var/log/jpcs-backup.log 2>&1`."] },
      { title: "Run all test cases", body: ["Go through TC-01 to TC-09 and screenshot each result. That's your deliverable."] },
    ],
    done: ["9/9 test cases pass, with screenshots.", "A one-page runbook: how to add an officer, restore a backup and check the logs."],
  },
};
