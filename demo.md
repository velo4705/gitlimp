<div align="center">

# Beacon

*Simple, self-hosted uptime monitoring for small teams.*

Beacon checks your services every 60 seconds and alerts you the moment something goes down — before your customers notice.

</div>

---

## Why Beacon

We built Beacon because the big monitoring suites are overkill for most teams. You don't need a second platform to learn, a fleet of agents to maintain, or a monthly bill that scales with headcount. Beacon runs on one tiny server and stays out of your way.

It started as an internal tool for our own status page. Three months later, it's running in production across a dozen of the small teams we work with.

## Getting Started

Clone the repo and start the stack:

```bash
git clone https://github.com/example/beacon
cd beacon
docker compose up -d
```

Point your browser at `http://localhost:8080` and add your first check. The default config watches your own instance, so you'll see it reporting healthy within a minute.

### Configuration

All settings live in a single `beacon.yml`. Here's a minimal example:

```yaml
checks:
  - name: Web
    url: https://example.com
    interval: 60s

notify:
  email:
    - on-call@example.com
```

No database server to provision — state is persisted to a small SQLite file in the data directory.

## The Dashboard

Every check is listed on one screen. Healthy services sit quietly in green; a failed check flips to red and starts a timer so you can see exactly how long it's been down.

![Beacon dashboard](media/image_for_test.png)

> [!NOTE]
> Notifications only fire after two consecutive failures, which filters out brief blips during deploys.

## Recovery

When a service comes back, Beacon runs a quick confirmation request before clearing the alert. This is the part we're most proud of — no false alarms, and no silent recoveries either.

1. First failure starts a pending timer.
2. A second consecutive failure triggers the alert.
3. A successful response marks the check healthy again.

Here's the recovery flow in code:

```go
func (m *Monitor) record(result Result) {
    if result.OK {
        m.failures = 0
        m.pending = false
        return
    }
    m.failures++
    if m.failures >= 2 && !m.pending {
        m.pending = true
        m.alerts.Notify(m.check)
    }
}
```

## Pricing

| Plan | Checks | History | Price |
|:-----|:-------|:--------|------:|
| Free | 5 | 24 hours | $0 |
| Team | 25 | 30 days | $9/mo |
| Scale | 250 | 1 year | $29/mo |

Self-hosting is always free — the paid plans add the hosted dashboard and Slack integration.

## What's Next

- [x] Slack notifications
- [x] Status page export
- [ ] PagerDuty integration
- [ ] SMS fallback for critical checks

## License

MIT — use it, fork it, run it on your own hardware. We'd love to hear how you use it.

*Beacon was built with a lot of coffee and an unreasonable fondness for uptime.*
