# AGENTS.md — ExamKiller (AZ104 workspace)

## Deployment (REGRA OBRIGATÓRIA)
- **NUNCA use Azure para deploy.** A subscription Azure (`Azure subscription 1`) está desativada/read-only. Opencode projects usam **máquinas Hetzner**.
- **Produção:** `https://azure.controlcrest.com` — máquina Hetzner **vm2** (`159.69.251.137`), app em `/opt/azure-cc`, porta `3001`, serviço systemd `examkiller-azure.service`, nginx + TLS (Let's Encrypt) já configurados.
- `az104.controlcrest.com` é outra instância antiga: `/opt/az104`, porta `3000`, serviço `examkiller.service`.
- **Sempre suba:** todo push para `master` faz deploy automático via GitHub Actions (`.github/workflows/deploy.yml`): testes → build → upload SSH → `npm ci && npm run build && systemctl restart examkiller-azure` → health check.
- **Deploy manual:** `tar` do código (excluir `node_modules`, `.next`, `data`, `tests`, `.git`, `.github`) → scp para `/tmp` → extrair em `/opt/azure-cc` → `npm ci` → `npm run build` → `systemctl restart examkiller-azure`.
- **Não sobrescreva `/opt/azure-cc/data/`** — contém o SQLite de progresso dos usuários.
- MySQL/SQLite: app usa `AZURE_CC_DB` (default `./data/examkiller.db`).

## Credenciais (não commitar)
- Token Hetzner API: `C:\Users\bsall\.secrets\hetzner.env` (`HCLOUD_TOKEN`).
- SSH vm2: chave `C:\Users\bsall\.ssh\id_ed25519_boris` (registrada na Hetzner como `bruno-laptop-recovery`), usuário `root`.
- GitHub secrets: `VM2_SSH_KEY` (id_ed25519_boris), `VM2_HOST` (159.69.251.137).

## Stack
- Next.js + TypeScript, SQLite (better-sqlite3), Tailwind, Vitest.
- Testes: `npm test` (vitest) · typecheck: `npx tsc --noEmit` · lint: `npx eslint .`
- Material de provas em `lib/exams/<code>/` (questions.ts, skills.ts, path.ts). Não edite o az-104 sem pedido explícito (outro chat cuida de roteamento/UI, mas deploy é de responsabilidade daqui).
