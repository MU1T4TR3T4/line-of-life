# Como colocar o site no ar com as fotos do Google Drive

São quatro passos, uns 20 minutos no total. Você só faz isso uma vez.

## 1. Criar a pasta no Google Drive

1. No seu Google Drive (o que está conectado no computador), crie uma pasta, por exemplo **Dante - Linha do tempo**.
2. Dentro dela, crie uma subpasta chamada **Ultrassom** para as imagens de ultrassom.
3. Abra a pasta principal no navegador. O link fica assim:
   `https://drive.google.com/drive/folders/1AbCdEfGh...`
   A parte depois de `folders/` é o **ID da pasta**. Guarde.

Pode organizar o resto em subpastas do jeito que quiser (por ano, por evento). O site lê todas.

## 2. Criar a "conta de serviço" no Google Cloud

É uma conta só para o site, que lê a pasta sem ter acesso ao resto do seu Drive.

1. Entre em https://console.cloud.google.com com a mesma conta Google do Drive.
2. No topo, clique no seletor de projeto → **Novo projeto** → nome `linha-do-tempo` → **Criar**.
3. No menu, vá em **APIs e serviços → Biblioteca**, procure **Google Drive API** e clique em **Ativar**.
4. Vá em **IAM e administrador → Contas de serviço → Criar conta de serviço**. Nome: `site-linha-do-tempo`. Clique em **Concluir** (não precisa dar papel nenhum).
5. Clique na conta criada → aba **Chaves** → **Adicionar chave → Criar nova chave → JSON**. Um arquivo `.json` será baixado. **Não compartilhe esse arquivo com ninguém.**
6. Copie o e-mail da conta de serviço (termina com `iam.gserviceaccount.com`).

## 3. Compartilhar a pasta com o site

1. No Google Drive, clique com o botão direito na pasta **Dante - Linha do tempo → Compartilhar**.
2. Cole o e-mail da conta de serviço, escolha **Leitor** e desmarque "Notificar".
3. Clique em **Compartilhar**.

## 4. Publicar o site na Vercel

1. Entre em https://vercel.com com a sua conta do GitHub.
2. **Add New → Project** → escolha o repositório `linha-do-tempo-dante` → **Import**.
3. Em **Environment Variables**, adicione:

| Nome | Valor |
| --- | --- |
| `DRIVE_FOLDER_ID` | o ID da pasta do passo 1 |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | abra o arquivo `.json` do passo 2 num editor de texto e cole o conteúdo inteiro |
| `SITE_PASSWORD` | a senha que a família vai usar para entrar |

4. Clique em **Deploy**. Em um ou dois minutos o site está no ar, num endereço `...vercel.app`.
5. Depois dá para ligar um domínio próprio (como `dante.com.br`) em **Settings → Domains**.

## Como as fotos entram na linha

- É só colocar fotos e vídeos na pasta. A cada 15 minutos o site olha a pasta de novo.
- A data vem da própria foto. Fotos do WhatsApp usam a data do nome do arquivo.
- No Google Drive, clique com o botão direito numa foto → **Informações do arquivo → Detalhes → Descrição** para escrever:
  - uma legenda, por exemplo `Primeira vez na praia`
  - `#marco` para destacar como marco (primeiros passos, aniversários)
  - `#data 10/03/2024` para corrigir uma data errada
  - nas fotos de ultrassom, `12 semanas` para o site calcular a data pela gestação
- Se as fotos estiverem no **Google Fotos**, dá para copiar para o Drive pelo Google Takeout (https://takeout.google.com), escolhendo "Google Fotos" e o destino "Adicionar ao Drive".

## Datas da criança

As datas de nascimento e a data prevista do parto ficam em `src/config.ts`.
