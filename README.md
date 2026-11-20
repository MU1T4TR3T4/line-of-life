# Linha do tempo do Dante

Site da família com a história do Dante, do primeiro ultrassom até hoje.

- **Computador:** Rio da vida, uma linha horizontal com polaroids que balançam, inclinam em 3D e abrem em tela cheia.
- **Celular:** Álbum de capítulos por idade, com modo histórias.
- **Fotos:** ficam numa pasta do Google Drive da família. O site lê a pasta a cada 15 minutos. Sem configuração, usa os momentos de exemplo de `src/lib/sample.ts`.
- **Acesso:** protegido pela senha da família (`SITE_PASSWORD`).

Para publicar e ligar o Drive, siga [docs/CONFIGURAR.md](docs/CONFIGURAR.md).

## Rodar

```bash
npm install
cp .env.example .env.local   # opcional: preencha para usar o Drive
npm run dev
```

Abra http://localhost:3000. Para forçar um modo: `?modo=rio` ou `?modo=album`.

## Configurar

Datas e nome ficam em `src/config.ts` (os valores atuais são de exemplo).

## Atalhos no Rio da vida

| Tecla | O que faz |
| --- | --- |
| Roda do mouse, arrastar, setas | andar pela linha |
| Ctrl + roda, `+` e `-` | zoom |
| `M` / `Shift+M` | próximo / anterior marco |
| `F` | modo filme |
| `Home` / `End` | início / hoje |
| Na foto aberta: setas, `L`, `Esc` | trocar, curtir, fechar |

## Etapas

1. Visual e interações com dados de exemplo (este código)
2. Ler fotos e vídeos da pasta do Google Drive, senha da família
3. Login e família
4. Modo filme com música, comparar fotos, filtros por pessoa
