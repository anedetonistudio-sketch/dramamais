# Drama+ (dramamais.com.br)

Streaming de **microdramas verticais 100% brasileiros** — novelas curtas em português, feitas no Brasil.
Modelo simples: **assinatura única de R$ 25/mês para assistir tudo — sem pagar por episódio, sem moedas.**

Stack: **Next.js 15 (App Router, TypeScript, Tailwind)** · **Supabase** (login e-mail/senha, Postgres, Storage) · **Mercado Pago** (assinaturas / preapproval) · deploy na **Vercel**. Instalável como app (PWA).

---

## O que já vem pronto

| Área | O que faz |
|---|---|
| **Home** (`/`) | Catálogo escuro, mobile-first: hero com o posicionamento (100% brasileiro, R$ 25/mês, sem moedas), série em destaque e fileiras por gênero. |
| **Série** (`/serie/[slug]`) | Capa, sinopse e lista de episódios com 🔒 nos exclusivos para assinantes. |
| **Player** (`/assistir/[slug]?ep=N`) | Tela cheia vertical 9:16, estilo feed: arrasta para cima para o próximo episódio, autoplay do próximo ao terminar, toque para som/pausar, barra de progresso. Episódios 1..N grátis (N por série, padrão 5); os demais mostram o paywall. |
| **Assinar** (`/assinar`) | Plano único **Mensal R$ 25,00/mês** → checkout do Mercado Pago (preapproval). |
| **Webhook** (`/api/mp/webhook`) | Recebe avisos do Mercado Pago e marca a assinatura como ativa/pausada/cancelada no Supabase. |
| **Entrar / cadastro** (`/entrar`) | E-mail + senha (Supabase Auth), recuperação de senha. |
| **Minha conta** (`/conta`) | Status da assinatura, próxima cobrança, botão “Instalar o app”, sair. |
| **Admin** (`/admin`) | Só para `is_admin = true`: criar/editar série (título, sinopse, gênero, capa, nº de episódios grátis, destaque, publicada) e enviar episódios (vários arquivos de uma vez, numerados em sequência). |
| **Proteção dos vídeos** | Vídeos ficam em bucket **privado**. A rota `/api/video/[id]` só gera URL assinada (2h) se o episódio for grátis **ou** o usuário tiver assinatura ativa. |
| **PWA** | Manifest (Drama+, standalone, tema escuro, ícones 192/512 + maskable + apple-touch-icon), service worker simples (página offline; nunca cacheia vídeo/API) e botão “Instalar o app” (Android/Chrome: prompt nativo; iPhone: instruções “Compartilhar > Adicionar à Tela de Início”). Aparece depois do 1º episódio assistido e em Minha conta. |
| **SEO** | Title/description, Open Graph com imagem gerada, `robots.txt`, `sitemap.xml`, favicon “D+”. |
| **Modo demo** | Sem as variáveis do Supabase o site roda com 3 séries de exemplo (vídeos e capas locais em `public/demo/`) — dá para publicar na Vercel e ver na hora. |

### Onde mudar preço e textos
Tudo em **`lib/config.ts`**: preço (`PLAN.price`), nome do plano, episódios grátis padrão e todas as frases de posicionamento (hero, paywall, rodapé, meta description).

---

## Como colocar no ar

### 1. Supabase
1. Crie um projeto em <https://supabase.com> (região **São Paulo**).
2. Abra **SQL Editor**, cole o conteúdo de **`supabase/schema.sql`** e rode. Isso cria as tabelas (`profiles`, `series`, `episodes`, `subscriptions`), as regras de segurança (RLS) e os buckets (`covers` público, `episodes` privado).
3. **Authentication > URL Configuration**: em *Site URL* coloque `https://dramamais.com.br` (ou a URL da Vercel enquanto o domínio não estiver pronto) e em *Redirect URLs* adicione `https://dramamais.com.br/auth/callback` e `https://SEU-PROJETO.vercel.app/auth/callback`.
4. (Opcional) **Authentication > Providers > Email**: desligue “Confirm email” se quiser que o cadastro entre direto, sem confirmar o e-mail.
5. **Storage > Settings**: o limite global de upload no plano grátis é 50 MB por arquivo. Episódios de 1–2 min em 720p costumam ficar abaixo disso; se precisar de mais, aumente no plano pago.
6. Copie em **Project Settings > API**: `Project URL`, `anon public` e `service_role`.

### 2. Vercel
1. **Add New > Project** → importe o repositório `dramamais` do GitHub (framework: Next.js, sem mudar nada).
2. Em **Settings > Environment Variables** cadastre (veja `.env.example`):

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://dramamais.com.br` (sem barra no final) |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave `anon public` |
| `SUPABASE_SERVICE_ROLE_KEY` | chave `service_role` (**secreta**) |
| `MP_ACCESS_TOKEN` | Access Token de **produção** do Mercado Pago |
| `MP_WEBHOOK_SECRET` | (opcional) assinatura secreta do webhook do MP |

3. Faça **Redeploy** depois de salvar as variáveis.

### 3. Virar admin
1. Crie sua conta no site em `/entrar`.
2. No SQL Editor do Supabase rode:
   ```sql
   update public.profiles set is_admin = true where email = 'seu@email.com';
   ```
3. Acesse `/admin` e cadastre as séries e episódios.

### 4. Mercado Pago
1. Em <https://www.mercadopago.com.br/developers/panel/app> crie uma aplicação (produto: *Assinaturas*) e copie o **Access Token de produção** para `MP_ACCESS_TOKEN`.
2. Em **Webhooks**, configure a URL de produção:
   `https://dramamais.com.br/api/mp/webhook`
   e marque o evento **Planos e assinaturas** (`subscription_preapproval` e `subscription_authorized_payment`).
3. Copie a **assinatura secreta** mostrada nessa tela para `MP_WEBHOOK_SECRET` (assim o site valida que o aviso veio mesmo do Mercado Pago).
4. Teste: assine com outra conta. Ao autorizar o pagamento, o status em *Minha conta* muda para **Ativa** em alguns segundos/minutos.
   - Atenção: o Mercado Pago exige que o e-mail do pagador seja o mesmo e-mail da conta MP que vai pagar. Por isso o checkout usa o e-mail do cadastro do Drama+.
   - O cancelamento é feito pelo assinante na conta do Mercado Pago; o webhook atualiza o status automaticamente.

### 5. Domínio
1. Registre **dramamais.com.br** no <https://registro.br>.
2. Na Vercel: **Settings > Domains > Add** `dramamais.com.br` e `www.dramamais.com.br`.
3. No Registro.br, em *DNS*, use os registros que a Vercel mostrar (A `76.76.21.21` para a raiz e CNAME `cname.vercel-dns.com` para o `www`), ou troque os servidores DNS para os da Vercel.
4. Depois atualize `NEXT_PUBLIC_SITE_URL`, a *Site URL* do Supabase e a URL do webhook no Mercado Pago, se estavam com a URL da Vercel.

---

## Rodar localmente
```bash
npm install
cp .env.example .env.local   # preencha, ou deixe sem Supabase para o modo demo
npm run dev                  # http://localhost:3000
npm run build                # build de produção
```

## Estrutura
```
app/
  page.tsx                 home (hero + fileiras por gênero)
  serie/[slug]/            página da série
  assistir/[slug]/         player vertical
  assinar/                 plano único + botão de checkout
  entrar/                  login/cadastro
  conta/                   minha conta
  admin/                   painel (séries e episódios)
  api/video/[episodeId]/   URL assinada (checa episódio grátis/assinatura)
  api/mp/checkout/         cria a assinatura no Mercado Pago
  api/mp/webhook/          recebe avisos do Mercado Pago
  manifest.ts              manifest do PWA
components/                Player, InstallApp, Paywall, Header, Footer…
lib/config.ts              preço, plano e textos (edite aqui)
lib/demo.ts                séries de demonstração
supabase/schema.sql        banco, RLS e buckets
public/sw.js               service worker
public/icons/              ícones do app
```

## Formato dos vídeos
- Vertical **9:16** (ex.: 720×1280 ou 1080×1920), MP4 com H.264 + AAC, `faststart` para começar a tocar rápido.
- Converter com ffmpeg:
  ```bash
  ffmpeg -i entrada.mov -vf "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2" \
    -c:v libx264 -crf 24 -preset medium -c:a aac -b:a 96k -movflags +faststart ep01.mp4
  ```
- As capas são verticais 2:3 (ex.: 600×900).

## Próximos passos sugeridos
- “Continuar assistindo” (salvar progresso por usuário).
- Pix como forma de pagamento (a assinatura recorrente do Mercado Pago é cobrada no cartão).
- Upload resumível (TUS) para vídeos grandes.
- Transcodificação/HLS (ex.: Mux ou Cloudflare Stream) quando o catálogo crescer.
