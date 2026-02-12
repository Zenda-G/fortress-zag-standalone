# Fortress Zag Deployment Profile

## Primary Target: Server/VM/PC

**Confirmed 2026-02-12:** Fortress Zag is optimized for always-on server environments, not embedded devices.

### Deployment Targets (Priority Order):

1. **VPS/Cloud Servers** (Primary)
   - DigitalOcean, Linode, AWS EC2, etc.
   - Always-on, reliable internet
   - GitHub Actions integration for burst compute
   - 
2. **Local PC/Workstation** (Secondary)
   - Development and testing
   - Heavy workloads (browser automation, large models)
   - Background scheduling

3. **Virtual Machines** (Tertiary)
   - WSL2, VirtualBox, VMware
   - Isolated environments
   - Development sandboxes

### NOT Primary Targets:
- ❌ Embedded boards (Raspberry Pi, LicheeRV, etc.)
- ❌ Ultra-low-power devices
- ❌ <$50 hardware

### Implications:

**Resource Budget:**
- RAM: 50-200MB acceptable (not <10MB)
- CPU: Multi-core OK
- Disk: SSD preferred, 1GB+ available
- Network: Reliable, high-bandwidth

**Focus Areas:**
- ✅ Reliability over minimal footprint
- ✅ GitHub Actions cloud bursting
- ✅ Web UI for remote management
- ✅ Telegram/Discord always-on bots
- ✅ Scheduled tasks and automation
- ✅ Multi-model fallback
- ✅ Browser automation (Playwright)

**De-prioritized:**
- ❌ Extreme memory optimization
- ❌ Binary compilation (pkg)
- ❌ Single-binary deployment
- ❌ <10MB RAM targets

### Recommended VPS Specs:
- 1 vCPU
- 512MB-1GB RAM
- 10GB SSD
- Ubuntu 22.04 LTS / Debian 12
- Git configured

### GitHub Actions Integration:
- Primary compute: Local VM/PC
- Burst compute: GitHub Actions (free tier)
- State sync: Git-backed memory
- Fork/cloning: Agent replication via repos

---
*Deployment Profile - Updated 2026-02-14*