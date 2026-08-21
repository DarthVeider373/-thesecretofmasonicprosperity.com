# Checkout embedado — produto físico (Brasil) — SEM banco

Formulário de pagamento dentro da sua página. A função no Supabase só cria a
sessão de checkout coletando o endereço de entrega. Zero tabelas, zero SQL.

Conta Stripe: NOVA · price_1U6fefEt4eVK2qhOywMI9IvO · envio: BR

## Passo a passo

### 1. Supabase (projeto NOVO)
Edge Functions -> cria as 2 funções:
  - create-checkout-session   (cola o index.ts)
  - session-status            (cola o index.ts)
Em CADA uma: Settings -> DESLIGA "Verify JWT" -> Save.
(No editor web elas nascem com nome aleatório -> renomeia no Settings.)

### 2. Secret
Edge Functions -> Secrets -> adiciona:
  STRIPE_SECRET_KEY = sk_live_...   (a chave NOVA, depois do Roll!)

### 3. Ajustes no código
- create-checkout-session/index.ts -> troca RETURN_URL pelo seu domínio.
  (PRICE_ID e o país BR já estão preenchidos.)
- index.html -> troca SEU_PROJECT_REF pelo ref do projeto Supabase novo.
- thank-you.html -> troca SEU_PROJECT_REF e o e-mail de suporte.

### 4. Front
Sobe index.html + thank-you.html (GitHub Pages ou Cloudflare Pages).
Adiciona seu banner na pasta img/ e troca o placeholder no index.html.

### 5. Teste
Abre a página: o formulário tem que carregar (sem girar eterno) e pedir
endereço de entrega. Paga, cai na thank-you, e o pedido aparece no painel do
Stripe com o endereço -> é de lá que você tira pra enviar.

## Rastreio
O front lê vtid/cid/click_id/fbclid da URL -> vira client_reference_id,
e os UTMs viram metadata na sessão do Stripe.

## Atenção
- Supabase free PAUSA o projeto após dias sem uso -> checkout fica girando.
  Se o tráfego for espaçado, considere o Payment Link puro (sem Supabase).
- Nunca coloque a sk_live no código nem em lugar público. Só no Secret.
